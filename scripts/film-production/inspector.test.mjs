import { test } from "node:test";
import { request } from "node:http";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createInspectorServer } from "./inspector-server.mjs";
function fixture() {
  return {
    version: 1,
    kind: "movies-import-candidate",
    projectId: "film",
    executionAllowed: false,
    documents: { private: { text: "PRIVATE DOCUMENT" } },
    shots: [
      {
        key: "plan:S1",
        source: "plan",
        record: { id: "S1", title: "<script>bad()</script>", camera: "Locked", action: "Pause" },
      },
      {
        key: "manifest:OLD1",
        source: "manifest",
        record: { id: "OLD1", description: "Legacy speech" },
      },
    ],
    references: [],
    takes: [],
    diagnostics: [
      { code: "UNMAPPED_SHOT", subject: "plan:S1", message: "Map explicitly", severity: "warning" },
    ],
  };
}
async function app(fn, options = {}, makeServer = createInspectorServer) {
  const server = makeServer({ bundle: fixture(), ...options });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}
async function isolatedAssets(fn) {
  const root = await mkdtemp(join(tmpdir(), "inspector-assets-"));
  try {
    // The server lives in the package and resolves assets from its own file URL.
    const sourceLegacy = new URL("../../packages/film-production/src/legacy/", import.meta.url);
    const legacyDir = join(root, "packages/film-production/src/legacy");
    await cp(sourceLegacy, legacyDir, { recursive: true });
    const assets = join(root, "film-studio/inspector");
    await mkdir(assets, { recursive: true });
    const { createInspectorServer: makeServer } = await import(
      pathToFileURL(join(legacyDir, "inspector-server.mjs")).href
    );
    await fn(assets, makeServer);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
async function view(base) {
  const r = await fetch(base + "/api/view");
  assert.equal(r.status, 200);
  return r.json();
}
function post(base, v, body, overrides = {}) {
  return fetch(base + "/api/propose", {
    method: "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      "X-Film-CSRF": v.csrf,
      ...overrides,
    },
    body: JSON.stringify(body),
  });
}
test("serves local inspector and a bounded projection without raw documents", () =>
  app(async (base) => {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-security-policy"), /frame-ancestors 'none'/);
    const v = await view(base);
    assert.equal(v.projectId, "film");
    assert.equal(v.shots[0].title, "<script>bad()</script>");
    assert.equal(v.review.revision, 0);
    assert.equal(JSON.stringify(v).includes("PRIVATE DOCUMENT"), false);
  }));
test("one server keeps its initial asset set and a later server sees disk replacements", () =>
  isolatedAssets(async (assets, makeServer) => {
    const versions = {
      "/": ["index.html", '<script type="module" src="/app.mjs"></script><!-- v1 -->', "text/html"],
      "/app.mjs": ["app.mjs", 'import { version } from "/jobs.mjs"; // v1', "text/javascript"],
      "/jobs.mjs": ["jobs.mjs", 'export const version = "v1";', "text/javascript"],
      "/style.css": ["style.css", "/* v1 */ body { color: black; }", "text/css"],
    };
    const writeVersion = async (version) => {
      for (const [name, contents] of Object.values(versions))
        await writeFile(join(assets, name), contents.replace("v1", version));
    };
    const checkVersion = async (base, version) => {
      for (const [path, [, contents, type]] of Object.entries(versions)) {
        const response = await fetch(base + path);
        assert.equal(response.status, 200);
        assert.ok(response.headers.get("content-type").startsWith(type));
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.equal(await response.text(), contents.replace("v1", version));
      }
    };
    await writeVersion("v1");
    await app(
      async (base) => {
        // Replace before the first request to rule out lazy per-route caching.
        await writeVersion("v2");
        await writeFile(join(assets, "extra.mjs"), 'export const extra = "new";');
        await checkVersion(base, "v1");
        assert.equal((await fetch(base + "/extra.mjs")).status, 404);
        await rm(join(assets, "jobs.mjs"));
        await checkVersion(base, "v1");
        await writeVersion("v2");
        await app((nextBase) => checkVersion(nextBase, "v2"), {}, makeServer);
        await checkVersion(base, "v1");
      },
      {},
      makeServer,
    );
  }));
test("missing required UI module refuses server initialization instead of a partial page", () =>
  isolatedAssets(async (assets, makeServer) => {
    await writeFile(join(assets, "index.html"), '<script type="module" src="/app.mjs"></script>');
    await writeFile(join(assets, "app.mjs"), 'import "/jobs.mjs";');
    await writeFile(join(assets, "style.css"), "body { color: black; }");
    assert.throws(() => makeServer({ bundle: fixture() }), { code: "ENOENT" });
  }));
test("explicit proposal advances session revision and stale request is refused", () =>
  app(async (base) => {
    const v = await view(base),
      c = {
        projectId: v.projectId,
        sourceFingerprint: v.review.sourceFingerprint,
        expectedRevision: 0,
        action: {
          type: "link-shot",
          planShotKey: "plan:S1",
          legacyShotKey: "manifest:OLD1",
          reason: "Compare",
        },
      };
    assert.equal((await post(base, v, c)).status, 200);
    assert.equal((await post(base, v, c)).status, 409);
    const saved = await (await fetch(base + "/api/review")).json();
    assert.equal(saved.revision, 1);
    assert.equal(saved.executionAllowed, false);
    assert.equal((await view(base)).review.revision, 1);
  }));
test("rejects foreign Origin, missing token, wrong content type and Host", () =>
  app(async (base) => {
    const v = await view(base);
    for (const headers of [
      { Origin: "https://example.com" },
      { "X-Film-CSRF": "" },
      { "Content-Type": "text/plain" },
    ])
      assert.notEqual((await post(base, v, {}, headers)).status, 200);
    assert.equal(
      await new Promise((resolve, reject) => {
        const req = request(base + "/api/view", { headers: { Host: "evil.example" } }, (res) => {
          res.resume();
          res.on("end", () => resolve(res.statusCode));
        });
        req.on("error", reject);
        req.end();
      }),
      403,
    );
  }));
test("media preview checks current bytes and refuses symlink escape", async () => {
  const root = await mkdtemp(join(tmpdir(), "inspector-media-"));
  const other = await mkdtemp(join(tmpdir(), "inspector-outside-"));
  try {
    const bytes = Buffer.from("owned-image"),
      sha = createHash("sha256").update(bytes).digest("hex");
    await writeFile(join(root, "ref.png"), bytes);
    const b = fixture();
    b.references = [
      {
        id: "R1",
        record: { label: "Identity", role: "identity" },
        media: { path: "ref.png", state: "verified", observedSha256: sha },
      },
    ];
    await app(
      async (base) => {
        let r = await fetch(base + "/api/media/reference/R1");
        assert.equal(r.status, 200);
        assert.deepEqual(Buffer.from(await r.arrayBuffer()), bytes);
        await writeFile(join(root, "ref.png"), "drift");
        assert.equal((await fetch(base + "/api/media/reference/R1")).status, 409);
        await rm(join(root, "ref.png"));
        await writeFile(join(other, "x.png"), bytes);
        await symlink(join(other, "x.png"), join(root, "ref.png"));
        assert.notEqual((await fetch(base + "/api/media/reference/R1")).status, 200);
      },
      { bundle: b, workspace: root },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(other, { recursive: true, force: true });
  }
});

test("UI filters source text safely, applies explicit mapping and reloads the server session", () =>
  app(async (base) => {
    const { Window } = await import("happy-dom");
    const { mountInspector } = await import("../../film-studio/inspector/app.mjs");
    const w = new Window();
    const page = await (await fetch(base)).text();
    w.document.write(page);
    const request = (path, options = {}) =>
      fetch(base + path, {
        ...options,
        headers: { ...options.headers, ...(options.method === "POST" ? { Origin: base } : {}) },
      });
    await mountInspector(w.document, request);
    assert.equal(w.document.getElementById("revision").textContent, "Review revision 0");
    assert.equal(w.document.querySelector("#detail script"), null);
    assert.ok(w.document.getElementById("detail").textContent.includes("<script>bad()</script>"));
    const search = w.document.getElementById("search");
    search.value = "notfound";
    search.dispatchEvent(new w.Event("input"));
    assert.match(w.document.getElementById("shots").textContent, /No matching/);
    search.value = "";
    search.dispatchEvent(new w.Event("input"));
    const form = w.document.getElementById("mapping-reason").form;
    w.document.getElementById("mapping-legacy-shot").value = "manifest:OLD1";
    w.document.getElementById("mapping-reason").value = "Explicit test mapping";
    form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    for (
      let i = 0;
      i < 100 && w.document.getElementById("revision").textContent !== "Review revision 1";
      i++
    )
      await new Promise((r) => setTimeout(r, 10));
    assert.equal(w.document.getElementById("revision").textContent, "Review revision 1");
    assert.equal((await (await fetch(base + "/api/review")).json()).shotLinks.length, 1);
    assert.match(w.document.getElementById("status").textContent, /Download review/);
    w.close();
  }));

test("split UTF-8 request chunks preserve the exact review reason", () =>
  app(async (base) => {
    const v = await view(base),
      reason = "Intenção — reação";
    const bytes = Buffer.from(
      JSON.stringify({
        projectId: v.projectId,
        sourceFingerprint: v.review.sourceFingerprint,
        expectedRevision: 0,
        action: {
          type: "link-shot",
          planShotKey: "plan:S1",
          legacyShotKey: "manifest:OLD1",
          reason,
        },
      }),
    );
    const split = bytes.indexOf(Buffer.from("ç")) + 1;
    const status = await new Promise((resolve, reject) => {
      const req = request(
        base + "/api/propose",
        {
          method: "POST",
          headers: { Origin: base, "Content-Type": "application/json", "X-Film-CSRF": v.csrf },
        },
        (res) => {
          res.resume();
          res.on("end", () => resolve(res.statusCode));
        },
      );
      req.on("error", reject);
      req.write(bytes.subarray(0, split));
      setTimeout(() => req.end(bytes.subarray(split)), 10);
    });
    assert.equal(status, 200);
    assert.equal(
      (await (await fetch(base + "/api/review")).json()).history[0].action.reason,
      reason,
    );
  }));

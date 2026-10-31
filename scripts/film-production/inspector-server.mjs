import { createServer } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute, sep, extname } from "node:path";
import { createReview, restoreReview, applyReview, reviewFingerprint } from "./review.mjs";
import { createJobControls } from "./inspector-jobs.mjs";
const types = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
};
const text = (v) => (typeof v === "string" ? v : "");
/** Companion session only. No arbitrary browser paths or source writes. */
export function createInspectorServer({
  bundle,
  state,
  workspace,
  jobStore,
  resultsWorkspace,
} = {}) {
  let review = state ? restoreReview(bundle, state) : createReview(bundle);
  const csrf = randomBytes(24).toString("hex");
  const jobs = createJobControls({ bundle, jobStore, resultsWorkspace, getReview: () => review });
  let pending = Promise.resolve();
  const mutate = (operation) => {
    const next = pending.then(operation);
    pending = next.catch(() => {});
    return next;
  };
  const mediaUrl = (kind, r) =>
    workspace &&
    ["verified", "observed-unverified"].includes(r.media?.state) &&
    r.record?.archived !== true
      ? `/api/media/${kind}/${encodeURIComponent(r.id)}`
      : null;
  const projection = () => ({
    projectId: bundle.projectId,
    csrf,
    review,
    reviewFingerprint: reviewFingerprint(review),
    shots: bundle.shots.map((s) => ({
      key: s.key,
      source: s.source,
      id: s.record.id,
      title: text(s.record.title) || text(s.record.description) || s.record.id,
      direction: Object.fromEntries(
        [
          "intention",
          "action",
          "camera",
          "acting",
          "dialogue",
          "lighting",
          "continuity",
          "framingRestriction",
        ]
          .filter((k) => text(s.record[k]))
          .map((k) => [k, s.record[k]]),
      ),
      lineIds: s.record.lineIds ?? [],
      declaredState: s.record.states ?? s.record.status ?? null,
    })),
    references: bundle.references.map((r) => ({
      id: r.id,
      label: text(r.record.label) || r.id,
      role: text(r.record.role),
      mediaState: r.media?.state ?? "unknown",
      sha256: r.media?.observedSha256 ?? null,
      url: mediaUrl("reference", r),
    })),
    takes: bundle.takes.map((t) => ({
      id: t.id,
      shotId: t.record.shotId,
      declaredStatus: t.record.status ?? "unknown",
      mediaState: t.media?.state ?? "unknown",
      sha256: t.media?.observedSha256 ?? null,
      url: mediaUrl("take", t),
    })),
    diagnostics: bundle.diagnostics ?? [],
  });
  const server = createServer(async (req, res) => {
    const address = server.address();
    const hosts = [`127.0.0.1:${address.port}`, `localhost:${address.port}`];
    const origin = `http://${req.headers.host}`;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    );
    const send = (status, data, type = "application/json") => {
      res.writeHead(status, { "Content-Type": type });
      res.end(type === "application/json" ? JSON.stringify(data) : data);
    };
    if (
      !hosts.includes(req.headers.host) ||
      (req.headers.origin && req.headers.origin !== origin)
    ) {
      send(403, { error: "Only the local inspector origin is allowed" });
      return;
    }
    try {
      const path = new URL(req.url, origin).pathname;
      if (req.method === "GET" && ["/", "/app.mjs", "/jobs.mjs", "/style.css"].includes(path)) {
        const name = path === "/" ? "index.html" : path.slice(1);
        const bytes = await readFile(
          new URL(`../../film-studio/inspector/${name}`, import.meta.url),
        );
        send(
          200,
          bytes,
          path === "/"
            ? "text/html; charset=utf-8"
            : path.endsWith("css")
              ? "text/css"
              : "text/javascript",
        );
        return;
      }
      if (req.method === "GET" && path === "/api/view") {
        send(200, projection());
        return;
      }
      if (req.method === "GET" && path === "/api/review") {
        res.setHeader("Content-Disposition", 'attachment; filename="film-review.json"');
        send(200, review);
        return;
      }
      if (req.method === "GET" && path === "/api/jobs") {
        send(200, await jobs.view());
        return;
      }
      const match = /^\/api\/media\/(reference|take)\/([^/]+)$/.exec(path);
      if (req.method === "GET" && match) {
        const record = (match[1] === "reference" ? bundle.references : bundle.takes).find(
          (r) => r.id === decodeURIComponent(match[2]),
        );
        if (!workspace || !record || !mediaUrl(match[1], record)) {
          send(404, { error: "Media unavailable" });
          return;
        }
        const source = record.media.path;
        if (
          typeof source !== "string" ||
          isAbsolute(source) ||
          source.includes("\\") ||
          source.includes(":") ||
          source.split("/").some((s) => !s || s === "." || s === "..")
        )
          throw new Error("Invalid media path");
        const root = await realpath(workspace),
          actual = await realpath(resolve(root, source)),
          rel = relative(root, actual);
        if (!rel || isAbsolute(rel) || rel.split(sep)[0] === "..")
          throw new Error("Invalid media path");
        const info = await stat(actual),
          type = types[extname(actual).toLowerCase()];
        if (!info.isFile() || info.size > 128 * 1024 * 1024 || !type)
          throw new Error("Unsupported media");
        const bytes = await readFile(actual);
        if (createHash("sha256").update(bytes).digest("hex") !== record.media.observedSha256) {
          send(409, { error: "Media bytes changed; refresh the import before previewing" });
          return;
        }
        send(200, bytes, type);
        return;
      }
      if (
        req.method === "POST" &&
        ["/api/propose", "/api/jobs/prepare", "/api/jobs/observe"].includes(path)
      ) {
        if (
          req.headers.origin !== origin ||
          req.headers["x-film-csrf"] !== csrf ||
          !/^application\/json(?:;|$)/.test(req.headers["content-type"] ?? "")
        ) {
          send(403, { error: "Local JSON request with session token required" });
          return;
        }
        const chunks = [];
        let byteCount = 0;
        for await (const chunk of req) {
          byteCount += chunk.length;
          if (byteCount > 65536) throw new Error("Request too large");
          chunks.push(chunk);
        }
        const body = Buffer.concat(chunks).toString("utf8");
        try {
          const command = JSON.parse(body);
          const result = await mutate(async () => {
            if (path === "/api/jobs/prepare") return jobs.prepare(command);
            if (path === "/api/jobs/observe") return jobs.observe(command);
            review = applyReview(bundle, review, command);
            return projection();
          });
          send(200, result);
        } catch (e) {
          send(409, { error: e.message });
        }
        return;
      }
      send(404, { error: "Unknown inspector route" });
    } catch {
      send(400, { error: "Inspector request could not be read; check the configured local input" });
    }
  });
  return server;
}

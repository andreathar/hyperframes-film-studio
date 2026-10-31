import { renderJobControls } from "./jobs.mjs";

export async function mountInspector(doc, request = globalThis.fetch.bind(globalThis)) {
  const $ = (id) => doc.getElementById(id);
  let view,
    jobs,
    jobError,
    selected,
    busy = false;
  const make = (tag, value, className) => {
    const n = doc.createElement(tag);
    if (value !== undefined) n.textContent = String(value);
    if (className) n.className = className;
    return n;
  };
  const append = (parent, ...children) => {
    parent.append(...children);
    return parent;
  };
  const error = (message) => {
    $("error").textContent = message;
    $("error").hidden = !message;
  };
  const showStatus = (message) => {
    $("status").textContent = message;
  };
  const json = async (path, options) => {
    const r = await request(path, options);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Inspector request failed");
    return data;
  };
  const button = (label, action, className) => {
    const b = make("button", label, className);
    b.type = "button";
    b.addEventListener("click", action);
    return b;
  };
  const field = (form, label, input, id) => {
    input.id = id;
    input.name = id;
    append(form, make("label", label));
    form.lastChild.htmlFor = id;
    form.append(input);
    return input;
  };
  const choose = (items, placeholder) => {
    const s = make("select");
    const blank = make("option", placeholder);
    blank.value = "";
    s.append(blank);
    for (const [value, label] of items) {
      const o = make("option", label);
      o.value = value;
      s.append(o);
    }
    s.required = true;
    return s;
  };
  function lock(value) {
    busy = value;
    for (const c of doc.querySelectorAll("button, input, select, textarea")) c.disabled = value;
  }
  async function propose(action) {
    if (busy) return;
    const command = {
      projectId: view.projectId,
      sourceFingerprint: view.review.sourceFingerprint,
      expectedRevision: view.review.revision,
      action,
    };
    lock(true);
    error("");
    try {
      view = await json("/api/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Film-CSRF": view.csrf },
        body: JSON.stringify(command),
      });
      render();
      showStatus("Proposal applied to this session. Download review to keep it.");
    } catch (e) {
      error(e.message + " — use Reload session if the review has changed.");
    } finally {
      lock(false);
    }
  }
  async function submitJob(path, payload) {
    if (busy) return;
    const command = {
      projectId: view.projectId,
      sourceFingerprint: view.review.sourceFingerprint,
      expectedRevision: jobs.revision,
      ...payload,
      ...(path === "/api/jobs/prepare"
        ? {
            expectedReviewRevision: view.review.revision,
            expectedReviewFingerprint: view.reviewFingerprint,
          }
        : {}),
    };
    lock(true);
    error("");
    try {
      jobs = await json(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Film-CSRF": view.csrf },
        body: JSON.stringify(command),
      });
      renderDetail();
      showStatus(
        "Job record saved. No provider was run. Shot review still needs Download review to keep it.",
      );
      const target = [...doc.querySelectorAll("[data-job-id]")].find(
        (row) => row.dataset.jobId === (payload.request?.id || payload.jobId),
      );
      target?.focus();
    } catch (e) {
      error(
        e.message +
          " — your input is kept. Use Reload session to refresh revisions before retrying.",
      );
    } finally {
      lock(false);
    }
  }
  function actionForm(section, key, label, controls, action) {
    const f = make("form");
    f.method = "post";
    f.action = "/api/propose";
    for (const [name, control] of controls)
      field(f, name, control, key + "-" + name.toLowerCase().replaceAll(" ", "-"));
    const reason = field(f, "Reason (required)", make("textarea"), key + "-reason");
    reason.required = true;
    reason.maxLength = 20000;
    reason.rows = 2;
    const submit = make("button", label, "primary");
    submit.type = "submit";
    f.append(submit);
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (f.reportValidity()) void propose({ ...action(), reason: reason.value });
    });
    section.append(f);
  }
  function section(title) {
    const s = make("section", undefined, "panel");
    s.append(make("h3", title));
    $("detail").append(s);
    return s;
  }
  function preview(parent, item, kind) {
    if (!item.url) {
      parent.append(
        make(
          "p",
          "Preview unavailable — media must be available in the configured workspace.",
          "muted",
        ),
      );
      return;
    }
    const path = new URL(item.url, "http://local.invalid");
    if (!path.pathname.startsWith("/api/media/")) return;
    const media = make(kind === "reference" ? "img" : "video");
    media.src = path.pathname;
    if (kind === "reference") {
      media.alt = item.label;
      media.loading = "lazy";
    } else {
      media.controls = true;
      media.preload = "none";
    }
    media.addEventListener("error", () => {
      const note = make(
        "p",
        "Preview could not load. The source may be missing, changed or unsupported.",
        "muted",
      );
      media.replaceWith(note);
    });
    parent.append(media);
  }
  function renderDetail() {
    const panel = $("detail");
    panel.replaceChildren();
    const shot = view.shots.find((s) => s.key === selected);
    if (!shot) {
      panel.append(make("p", "No shot selected. Choose a shot from the list."));
      return;
    }
    const top = append(
      make("div", undefined, "shot-heading"),
      make("p", shot.source === "plan" ? "VISUAL PLAN" : "LEGACY MANIFEST", "eyebrow"),
      make("h2", shot.id),
      make("p", shot.title, "shot-title"),
    );
    panel.append(top);
    const direction = section("Direction & source notes");
    const dl = make("dl");
    for (const [key, value] of Object.entries(shot.direction))
      append(dl, make("dt", key), make("dd", value));
    if (!dl.children.length)
      direction.append(make("p", "No direction notes are recorded for this source shot.", "muted"));
    else direction.append(dl);
    if (shot.lineIds.length)
      direction.append(make("p", "Dialogue lines: " + shot.lineIds.join(", ")));
    direction.append(
      make("p", "Source state: " + JSON.stringify(shot.declaredState ?? "not recorded"), "muted"),
    );
    const mapping = section("Shot mapping");
    if (shot.source === "plan") {
      const current = view.review.shotLinks.find((l) => l.planShotKey === shot.key);
      mapping.append(
        make(
          "p",
          current
            ? "Mapped to " + current.legacyShotKey
            : "Unmapped — choose equivalent legacy coverage explicitly.",
          "muted",
        ),
      );
      const legacy = choose(
        view.shots
          .filter((s) => s.source === "manifest")
          .map((s) => [s.key, s.id + " · " + s.title]),
        "Choose a legacy shot",
      );
      actionForm(mapping, "mapping", "Apply mapping proposal", [["Legacy shot", legacy]], () => ({
        type: "link-shot",
        planShotKey: shot.key,
        legacyShotKey: legacy.value,
      }));
      if (current)
        actionForm(mapping, "unlink", "Remove mapping", [], () => ({
          type: "unlink-shot",
          planShotKey: shot.key,
        }));
    } else
      mapping.append(
        make("p", "Legacy source. Candidate takes must belong to this recorded shot."),
      );
    const refs = section("References");
    const refGrid = make("div", undefined, "media-grid");
    for (const r of view.references) {
      const card = append(
        make("article", undefined, "media-item"),
        make("h4", r.label),
        make("p", (r.role || "Role not declared") + " · " + r.mediaState, "muted"),
      );
      preview(card, r, "reference");
      const assignment = view.review.references.find(
        (a) => a.shotKey === shot.key && a.referenceId === r.id,
      );
      if (assignment) card.append(make("p", "Assigned as " + assignment.role, "selection"));
      refGrid.append(card);
    }
    if (!view.references.length)
      refs.append(make("p", "No reference records were imported.", "muted"));
    else refs.append(refGrid);
    const availableRefs = view.references.filter((r) => r.role && r.mediaState === "verified");
    if (availableRefs.length) {
      const ref = choose(
        availableRefs.map((r) => [r.id, r.label + " · " + r.role]),
        "Choose a verified reference",
      );
      actionForm(refs, "reference", "Assign reference proposal", [["Reference", ref]], () => {
        const r = availableRefs.find((r) => r.id === ref.value);
        return {
          type: "assign-reference",
          shotKey: shot.key,
          referenceId: r.id,
          role: r.role,
          expectedMediaSha256: r.sha256,
        };
      });
    } else
      refs.append(make("p", "Assignment needs a declared role and verified media hash.", "muted"));
    for (const a of view.review.references.filter((r) => r.shotKey === shot.key))
      actionForm(refs, "clear-ref-" + a.referenceId, "Remove " + a.referenceId, [], () => ({
        type: "clear-reference",
        shotKey: shot.key,
        referenceId: a.referenceId,
      }));
    const takes = section("Candidate takes");
    const legacyKey =
      shot.source === "manifest"
        ? shot.key
        : view.review.shotLinks.find((l) => l.planShotKey === shot.key)?.legacyShotKey;
    const legacy = view.shots.find((s) => s.key === legacyKey);
    const candidates = legacy ? view.takes.filter((t) => t.shotId === legacy.id) : [];
    if (!legacy)
      takes.append(make("p", "Map this plan shot before selecting a legacy take.", "muted"));
    else if (!candidates.length)
      takes.append(
        make(
          "p",
          "No takes match this recorded source shot. Reconcile the source IDs before selecting.",
          "muted",
        ),
      );
    const takeGrid = make("div", undefined, "media-grid");
    for (const t of candidates) {
      const card = append(
        make("article", undefined, "media-item"),
        make("h4", t.id),
        make("p", t.mediaState + " · source status: " + t.declaredStatus, "muted"),
      );
      preview(card, t, "take");
      takeGrid.append(card);
    }
    takes.append(takeGrid);
    const available = candidates.filter((t) =>
      ["verified", "observed-unverified"].includes(t.mediaState),
    );
    if (available.length) {
      const pick = choose(
        available.map((t) => [t.id, t.id]),
        "Choose a candidate take",
      );
      actionForm(takes, "take", "Select candidate proposal", [["Take", pick]], () => {
        const t = available.find((t) => t.id === pick.value);
        return {
          type: "select-take",
          shotKey: shot.key,
          takeId: t.id,
          expectedMediaSha256: t.sha256,
        };
      });
    }
    const currentTake = view.review.takes.find((t) => t.shotKey === shot.key);
    if (currentTake) {
      takes.append(make("p", "Selected candidate: " + currentTake.takeId, "selection"));
      actionForm(takes, "clear-take", "Clear candidate selection", [], () => ({
        type: "clear-take",
        shotKey: shot.key,
      }));
    }
    renderJobControls({
      doc,
      parent: section("Production jobs"),
      shotKey: shot.key,
      jobs,
      jobError,
      submit: submitJob,
    });
  }
  function renderShots() {
    const search = $("search").value.toLowerCase(),
      source = $("source").value;
    const shots = view.shots.filter(
      (s) =>
        (source === "all" || s.source === source) &&
        [s.id, s.title, ...Object.values(s.direction)].join(" ").toLowerCase().includes(search),
    );
    $("count").textContent = shots.length + " / " + view.shots.length;
    $("shots").replaceChildren();
    for (const shot of shots) {
      const b = button(
        "",
        () => {
          selected = shot.key;
          renderShots();
          renderDetail();
        },
        "shot",
      );
      b.dataset.key = shot.key;
      b.setAttribute("aria-current", String(selected === shot.key));
      append(
        b,
        make("strong", shot.id),
        make("span", shot.title),
        make("small", shot.source === "plan" ? "Visual plan" : "Legacy manifest"),
      );
      $("shots").append(b);
    }
    if (!shots.length)
      $("shots").append(
        make("p", "No matching shots. Clear the search or change the source filter.", "empty"),
      );
  }
  function render() {
    $("project").textContent = view.projectId;
    $("revision").textContent = "Review revision " + view.review.revision;
    $("finding-count").textContent = view.diagnostics.length;
    $("diagnostics").replaceChildren();
    for (const d of view.diagnostics)
      $("diagnostics").append(
        append(make("li"), make("strong", d.code + " · " + d.subject), make("span", d.message)),
      );
    if (!view.diagnostics.length)
      $("diagnostics").append(
        make("li", "No reconciliation findings were imported. This does not grant approval."),
      );
    renderShots();
    renderDetail();
  }
  async function reload() {
    if (busy) return;
    lock(true);
    error("");
    try {
      view = await json("/api/view");
      jobError = "";
      try {
        jobs = await json("/api/jobs");
      } catch (e) {
        jobs = undefined;
        jobError = "Job tracking could not be loaded. " + e.message;
      }
      if (!selected) selected = view.shots[0]?.key;
      render();
      showStatus("Review session loaded. Source declarations remain evidence.");
    } catch (e) {
      error(e.message);
    } finally {
      lock(false);
    }
  }
  $("search").addEventListener("input", () => {
    if (view) renderShots();
  });
  $("source").addEventListener("change", () => {
    if (view) renderShots();
  });
  $("revision").parentNode.insertBefore(
    button("Reload session", () => void reload(), "secondary"),
    $("download"),
  );
  await reload();
}
if (typeof document !== "undefined") void mountInspector(document);

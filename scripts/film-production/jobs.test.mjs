import test from "node:test";
import assert from "node:assert/strict";
import { createJobs, applyJob, restoreJobs } from "./jobs.mjs";
import { createReview, applyReview } from "./review.mjs";
import { fixture, command, receipt, evidence } from "./fixtures/jobs.mjs";
function prepared() {
  const f = fixture(),
    initial = createJobs(f.bundle);
  const state = applyJob(
    f.bundle,
    initial,
    command(initial, {
      type: "prepare",
      request: f.request,
      review: f.review,
      reason: "Prepare a candidate",
    }),
  );
  return { ...f, initial, state };
}
test("preparation preserves shot/review/reference provenance without modifying inputs or granting authority", () => {
  const f = fixture(),
    before = JSON.stringify(f),
    initial = createJobs(f.bundle);
  const s = applyJob(
    f.bundle,
    initial,
    command(initial, {
      type: "prepare",
      request: f.request,
      review: f.review,
      reason: "Intenção — reação",
    }),
  );
  assert.equal(JSON.stringify(f), before);
  assert.equal(initial.revision, 0);
  assert.equal(s.revision, 1);
  assert.equal(s.executionAllowed, false);
  assert.equal(s.jobs[0].state, "prepared");
  assert.equal(s.jobs[0].review.revision, 1);
  assert.deepEqual(s.jobs[0].references, [
    { referenceId: "R1", role: "identity", sha256: "a".repeat(64) },
  ]);
  assert.deepEqual(s.jobs[0].shot.record.lineIds, ["L1"]);
  assert.equal(s.history[0].action.reason, "Intenção — reação");
  assert.deepEqual(restoreJobs(f.bundle, JSON.parse(JSON.stringify(s))), s);
});
test("duplicate request cannot be hidden by another job ID or review reason", () => {
  const f = prepared();
  assert.throws(
    () =>
      applyJob(
        f.bundle,
        f.state,
        command(f.state, {
          type: "prepare",
          request: { ...f.request, id: "job-2" },
          review: f.review,
          reason: "Rename only",
        }),
      ),
    /duplicate/i,
  );
  const review = structuredClone(f.review);
  review.history[0].action.reason = "New explanation";
  assert.throws(
    () =>
      applyJob(
        f.bundle,
        f.state,
        command(f.state, {
          type: "prepare",
          request: { ...f.request, id: "job-2" },
          review,
          reason: "New review history",
        }),
      ),
    /duplicate/i,
  );
});
test("an actual prompt change creates a separate job but cannot reuse the old job ID", () => {
  const f = prepared(),
    request = { ...f.request, prompt: "A different action." };
  assert.throws(
    () =>
      applyJob(
        f.bundle,
        f.state,
        command(f.state, { type: "prepare", request, review: f.review, reason: "Another intent" }),
      ),
    /duplicate/i,
  );
  request.id = "job-2";
  const s = applyJob(
    f.bundle,
    f.state,
    command(f.state, { type: "prepare", request, review: f.review, reason: "Another intent" }),
  );
  assert.equal(s.jobs.length, 2);
  assert.notEqual(s.jobs[0].requestFingerprint, s.jobs[1].requestFingerprint);
});
for (const [name, change] of [
  [
    "foreign project",
    (f, c) => {
      c.projectId = "foreign";
    },
  ],
  [
    "stale revision",
    (f, c) => {
      c.expectedRevision = 5;
    },
  ],
  [
    "changed import",
    (f) => {
      f.bundle.documents.changed = { sha256: "f".repeat(64) };
    },
  ],
  [
    "forged review",
    (f, c) => {
      c.action.review.references = [];
    },
  ],
  [
    "unknown shot",
    (f, c) => {
      c.action.request.shotKey = "plan:absent";
    },
  ],
  [
    "unsupported route",
    (f, c) => {
      c.action.request.route = "heygen-api";
    },
  ],
  [
    "authority field",
    (f, c) => {
      c.action.request.approved = true;
    },
  ],
  [
    "invalid output timing",
    (f, c) => {
      c.action.request.output.durationFrames = 0;
    },
  ],
  [
    "nonfinite output",
    (f, c) => {
      c.action.request.output.fps = NaN;
    },
  ],
])
  test(`preparation refuses ${name}`, () => {
    const f = fixture(),
      s = createJobs(f.bundle),
      c = command(s, {
        type: "prepare",
        request: f.request,
        review: f.review,
        reason: "Candidate",
      });
    change(f, c);
    assert.throws(() => applyJob(f.bundle, s, c));
  });
test("unknown outcome reconciles to success with stable external identity and candidate outputs", () => {
  const f = prepared(),
    unknown = { ...receipt(f.state.jobs[0], "unknown"), externalId: null };
  let s = applyJob(
    f.bundle,
    f.state,
    command(f.state, { type: "observe", receipt: unknown, evidence, reason: "Receipt uncertain" }),
  );
  assert.equal(s.jobs[0].state, "unknown");
  const done = {
    ...receipt(s.jobs[0], "reported-succeeded"),
    outputs: [{ path: "results/clip.mp4", kind: "video", sha256: "b".repeat(64) }],
  };
  s = applyJob(
    f.bundle,
    s,
    command(s, {
      type: "observe",
      receipt: done,
      evidence: { ...evidence, sha256: "d".repeat(64) },
      reason: "Downloaded result",
    }),
  );
  assert.equal(s.jobs[0].externalId, "external-1");
  assert.equal(s.jobs[0].outputs[0].status, "candidate");
  assert.equal(s.executionAllowed, false);
  assert.deepEqual(restoreJobs(f.bundle, s), s);
  assert.throws(
    () =>
      applyJob(
        f.bundle,
        s,
        command(s, {
          type: "observe",
          receipt: receipt(s.jobs[0]),
          evidence,
          reason: "Old running observation",
        }),
      ),
    /terminal/i,
  );
});
for (const [name, change] of [
  [
    "foreign receipt project",
    (r) => {
      r.projectId = "other";
    },
  ],
  [
    "wrong request",
    (r) => {
      r.requestFingerprint = "f".repeat(64);
    },
  ],
  [
    "wrong route",
    (r) => {
      r.route = "local-manual";
    },
  ],
  [
    "missing external ID",
    (r) => {
      r.externalId = null;
    },
  ],
  [
    "unsupported receipt field",
    (r) => {
      r.approved = true;
    },
  ],
  [
    "success without output",
    (r) => {
      r.status = "reported-succeeded";
    },
  ],
  [
    "nonterminal output",
    (r) => {
      r.outputs = [{ path: "result.mp4", kind: "video", sha256: "a".repeat(64) }];
    },
  ],
  [
    "unsupported status",
    (r) => {
      r.status = "approved";
    },
  ],
])
  test(`observation refuses ${name}`, () => {
    const f = prepared(),
      r = receipt(f.state.jobs[0]);
    change(r);
    assert.throws(() =>
      applyJob(
        f.bundle,
        f.state,
        command(f.state, { type: "observe", receipt: r, evidence, reason: "Observe" }),
      ),
    );
  });
test("external IDs stay bound to the same job and cannot be adopted by another request", () => {
  const f = prepared();
  let s = applyJob(
    f.bundle,
    f.state,
    command(f.state, {
      type: "observe",
      receipt: receipt(f.state.jobs[0]),
      evidence,
      reason: "Known job",
    }),
  );
  assert.throws(
    () =>
      applyJob(
        f.bundle,
        s,
        command(s, {
          type: "observe",
          receipt: { ...receipt(s.jobs[0]), externalId: "different" },
          evidence,
          reason: "Changed ID",
        }),
      ),
    /external/i,
  );
  s = applyJob(
    f.bundle,
    s,
    command(s, {
      type: "prepare",
      request: { ...f.request, id: "job-2", prompt: "Different action" },
      review: f.review,
      reason: "Another request",
    }),
  );
  assert.throws(
    () =>
      applyJob(
        f.bundle,
        s,
        command(s, { type: "observe", receipt: receipt(s.jobs[1]), evidence, reason: "Reused ID" }),
      ),
    /external/i,
  );
});
test("derived job fields cannot bypass history replay", () => {
  const f = prepared(),
    s = structuredClone(f.state);
  s.jobs[0].request.prompt = "Edited behind history";
  assert.throws(() => restoreJobs(f.bundle, s));
});

test("the same effective references on another shot cannot disguise duplicate intent", () => {
  const f = prepared();
  const review = applyReview(
    f.bundle,
    f.review,
    command(f.review, {
      type: "assign-reference",
      shotKey: "plan:S2",
      referenceId: "R1",
      role: "identity",
      expectedMediaSha256: "a".repeat(64),
      reason: "Compare same identity",
    }),
  );
  assert.throws(
    () =>
      applyJob(
        f.bundle,
        f.state,
        command(f.state, {
          type: "prepare",
          request: { ...f.request, id: "job-2", shotKey: "plan:S2" },
          review,
          reason: "Another shot label",
        }),
      ),
    /duplicate/i,
  );
});
test("additional aliases for identical role and reference bytes cannot disguise duplicate intent", () => {
  const f = fixture();
  f.bundle.references.push({ ...structuredClone(f.bundle.references[0]), id: "R-alias" });
  let review = createReview(f.bundle);
  const assign = (referenceId) => ({
    type: "assign-reference",
    shotKey: "plan:S1",
    referenceId,
    role: "identity",
    expectedMediaSha256: "a".repeat(64),
    reason: "Synthetic same-byte reference",
  });
  review = applyReview(f.bundle, review, command(review, assign("R1")));
  let state = createJobs(f.bundle);
  state = applyJob(
    f.bundle,
    state,
    command(state, { type: "prepare", request: f.request, review, reason: "First intent" }),
  );
  review = applyReview(f.bundle, review, command(review, assign("R-alias")));
  assert.throws(
    () =>
      applyJob(
        f.bundle,
        state,
        command(state, {
          type: "prepare",
          request: { ...f.request, id: "job-2" },
          review,
          reason: "Reference alias only",
        }),
      ),
    /duplicate/i,
  );
});

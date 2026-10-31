import { readJobStore, updateJobStore } from "./job-store.mjs";
import { reviewFingerprint } from "./review.mjs";
function shape(value, keys) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => !keys.includes(k))
  )
    throw new Error("Unsupported job control field");
}
export function createJobControls({ bundle, jobStore, resultsWorkspace, getReview }) {
  const project = async () => {
    if (!jobStore) return { enabled: false, canObserve: false, jobs: [], executionAllowed: false };
    const state = await readJobStore(bundle, jobStore);
    return {
      enabled: true,
      canObserve: Boolean(resultsWorkspace),
      revision: state.revision,
      executionAllowed: false,
      jobs: state.jobs.map((j) => ({
        id: j.id,
        shotKey: j.request.shotKey,
        route: j.request.route,
        model: j.request.model,
        prompt: j.request.prompt,
        output: j.request.output,
        state: j.state,
        externalId: j.externalId,
        referenceCount: j.references.length,
        outputCount: j.outputs.length,
        observationCount: j.observations.length,
      })),
    };
  };
  return {
    view: project,
    async prepare(body) {
      if (!jobStore) throw new Error("Job tracking is not connected for this session");
      shape(body, [
        "projectId",
        "sourceFingerprint",
        "expectedRevision",
        "expectedReviewRevision",
        "expectedReviewFingerprint",
        "request",
        "reason",
      ]);
      const review = getReview();
      if (
        body.expectedReviewRevision !== review.revision ||
        body.expectedReviewFingerprint !== reviewFingerprint(review)
      )
        throw new Error("Shot review changed; reload session before preparing intent");
      await updateJobStore(bundle, jobStore, {
        projectId: body.projectId,
        sourceFingerprint: body.sourceFingerprint,
        expectedRevision: body.expectedRevision,
        action: { type: "prepare", request: body.request, review, reason: body.reason },
      });
      return project();
    },
    async observe(body) {
      if (!jobStore || !resultsWorkspace)
        throw new Error("Result receipt recording is not connected for this session");
      shape(body, [
        "projectId",
        "sourceFingerprint",
        "expectedRevision",
        "jobId",
        "receiptPath",
        "reason",
      ]);
      if (typeof body.jobId !== "string" || !body.jobId.trim())
        throw new Error("Choose the job for this receipt");
      await updateJobStore(
        bundle,
        jobStore,
        {
          projectId: body.projectId,
          sourceFingerprint: body.sourceFingerprint,
          expectedRevision: body.expectedRevision,
          action: {
            type: "observe",
            jobId: body.jobId,
            receiptPath: body.receiptPath,
            reason: body.reason,
          },
        },
        { workspace: resultsWorkspace },
      );
      return project();
    },
  };
}

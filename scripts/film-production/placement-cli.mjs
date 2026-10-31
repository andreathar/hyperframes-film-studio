import { parseArgs } from "node:util";
import { readJobJson } from "./job-store.mjs";
import { compilePlacement, preparePlacement } from "./placement.mjs";
import { restoreReview, reviewFingerprint } from "./review.mjs";
try {
  const { values } = parseArgs({
    options: {
      import: { type: "string" },
      review: { type: "string" },
      plan: { type: "string" },
      workspace: { type: "string" },
      output: { type: "string" },
      describe: { type: "boolean" },
      help: { type: "boolean" },
    },
  });
  if (values.help)
    console.log(
      "Usage: bun run film:place --import <import.json> --review <review.json> --plan <cut-plan.json> [--workspace <canonical-root> --output <new-composition>]\nUse --describe instead of --plan to inspect binding fields and current selections. Preview only by default. Explicit candidate placement; no source or existing timeline replacement, no generation or creative approval.",
    );
  else {
    if (!values.import || !values.review || (!values.describe && !values.plan))
      throw new Error("--import, --review and --plan (or --describe) are required");
    if (Boolean(values.workspace) !== Boolean(values.output))
      throw new Error("--workspace and --output must be supplied together for preparation");
    const bundle = await readJobJson(values.import),
      review = restoreReview(bundle, await readJobJson(values.review));
    let result;
    if (values.describe) {
      if (values.plan || values.workspace || values.output)
        throw new Error("--describe only inspects import/review bindings");
      result = {
        version: 1,
        projectId: bundle.projectId,
        sourceFingerprint: review.sourceFingerprint,
        reviewFingerprint: reviewFingerprint(review),
        expectedReviewRevision: review.revision,
        selections: review.takes,
        executionAllowed: false,
      };
    } else {
      const input = {
        bundle,
        review,
        plan: await readJobJson(values.plan),
        workspace: values.workspace,
        output: values.output,
      };
      result = values.output
        ? await preparePlacement(input)
        : compilePlacement(input.bundle, input.review, input.plan);
    }
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Placement failed");
  process.exitCode = 1;
}

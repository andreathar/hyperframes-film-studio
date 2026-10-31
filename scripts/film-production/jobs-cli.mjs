import { parseArgs } from "node:util";
import { initializeJobStore, readJobStore, updateJobStore, readJobJson } from "./job-store.mjs";
import { reviewFingerprint } from "./review.mjs";
try {
  const { values } = parseArgs({
    options: {
      import: { type: "string" },
      store: { type: "string" },
      operation: { type: "string", default: "show" },
      review: { type: "string" },
      request: { type: "string" },
      workspace: { type: "string" },
      receipt: { type: "string" },
      "expected-revision": { type: "string" },
      reason: { type: "string" },
      help: { type: "boolean" },
    },
  });
  if (values.help)
    console.log(
      "Usage: bun run film:jobs --import <import.json> --store <private-store> [--operation show|init|prepare|observe]\nprepare: --review <review.json> --request <intent.json> --expected-revision N --reason <text>\nobserve: --workspace <root> --receipt <relative-receipt.json> --expected-revision N --reason <text>\nLocal preparation and external observations only; no submission, retry, approvals or timeline writes.",
    );
  else {
    if (!values.import || !values.store) throw new Error("--import and --store are required");
    if (!["show", "init", "prepare", "observe"].includes(values.operation))
      throw new Error("Unsupported job operation");
    const inputNames = Object.keys(values).filter(
      (k) => !["import", "store", "operation", "help"].includes(k),
    );
    const allowed =
      values.operation === "prepare"
        ? ["review", "request", "expected-revision", "reason"]
        : values.operation === "observe"
          ? ["workspace", "receipt", "expected-revision", "reason"]
          : [];
    if (inputNames.some((k) => !allowed.includes(k)))
      throw new Error("Flag does not apply to selected operation");
    const bundle = await readJobJson(values.import);
    let state;
    if (values.operation === "show") state = await readJobStore(bundle, values.store);
    else if (values.operation === "init") state = await initializeJobStore(bundle, values.store);
    else {
      if (
        !/^(0|[1-9][0-9]*)$/.test(values["expected-revision"] ?? "") ||
        !Number.isSafeInteger(Number(values["expected-revision"]))
      )
        throw new Error("An explicit --expected-revision integer is required");
      if (!values.reason?.trim()) throw new Error("--reason is required");
      let action;
      if (values.operation === "prepare") {
        if (!values.review || !values.request)
          throw new Error("--review and --request are required");
        action = {
          type: "prepare",
          review: await readJobJson(values.review),
          request: await readJobJson(values.request),
          reason: values.reason,
        };
      } else {
        if (!values.workspace || !values.receipt)
          throw new Error("--workspace and --receipt are required");
        action = { type: "observe", receiptPath: values.receipt, reason: values.reason };
      }
      state = await updateJobStore(
        bundle,
        values.store,
        {
          projectId: bundle.projectId,
          sourceFingerprint: reviewFingerprint(bundle),
          expectedRevision: Number(values["expected-revision"]),
          action,
        },
        { workspace: values.workspace },
      );
    }
    console.log(JSON.stringify(state, null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Job command failed");
  process.exitCode = 1;
}

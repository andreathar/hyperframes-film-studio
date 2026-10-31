import { parseArgs } from "node:util";
import { readJobJson, readJobStore } from "./job-store.mjs";
import { createKlingHandoff, writeKlingHandoff } from "./kling-handoff.mjs";
try {
  const { values } = parseArgs({
    options: Object.fromEntries([
      ...[
        "import",
        "store",
        "review",
        "job",
        "expected-revision",
        "request-fingerprint",
        "settings",
        "workspace",
        "film",
        "output",
      ].map((k) => [k, { type: "string" }]),
      ["help", { type: "boolean" }],
    ]),
  });
  if (values.help)
    console.log(
      "Usage: bun run film:kling-handoff --import <import.json> --store <job-store> --review <review.json> --job <id> --expected-revision N --request-fingerprint <sha256> --settings <settings.json> --workspace <canonical-root> --film <relative-film-dir> [--output <new-private-directory>]\nPreview only by default. Exports a blocked producer candidate; never submits or grants approval. Requires Python 3 stdlib and Linux descriptor verification.",
    );
  else {
    for (const key of [
      "import",
      "store",
      "review",
      "job",
      "expected-revision",
      "request-fingerprint",
      "settings",
      "workspace",
      "film",
    ])
      if (!values[key]) throw new Error(`--${key} is required`);
    if (
      !/^(0|[1-9][0-9]*)$/.test(values["expected-revision"]) ||
      !Number.isSafeInteger(Number(values["expected-revision"]))
    )
      throw new Error("Invalid expected revision");
    const bundle = await readJobJson(values.import),
      state = await readJobStore(bundle, values.store);
    const packet = await createKlingHandoff({
      bundle,
      state,
      review: await readJobJson(values.review),
      jobId: values.job,
      expectedRevision: Number(values["expected-revision"]),
      requestFingerprint: values["request-fingerprint"],
      settings: await readJobJson(values.settings),
      workspace: values.workspace,
      film: values.film,
    });
    if (values.output) {
      const latest = await readJobStore(bundle, values.store);
      if (latest.revision !== state.revision)
        throw new Error("Job store changed during handoff inspection");
      await writeKlingHandoff(packet, values.output, values.workspace);
    }
    console.log(JSON.stringify(packet, null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Kling handoff failed");
  process.exitCode = 1;
}

import { parseArgs } from "node:util";
import { inspectMovies, saveImport, importReport } from "./import-movies.mjs";
try {
  const { values } = parseArgs({
    options: {
      workspace: { type: "string" },
      output: { type: "string" },
      help: { type: "boolean" },
    },
  });
  if (values.help)
    console.log(
      "Usage: bun run film:import --workspace <Movies_Projects> [--output <new-directory>]\nDefault: read-only reconciliation report. --output saves a candidate snapshot, never activates it.",
    );
  else {
    if (!values.workspace) throw new Error("--workspace is required");
    const bundle = await inspectMovies(values.workspace);
    const report = values.output
      ? await saveImport(values.workspace, bundle, values.output)
      : importReport(bundle);
    console.log(
      JSON.stringify({ ...report, mode: values.output ? "snapshot" : "dry-run" }, null, 2),
    );
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : "Import failed");
  process.exitCode = 1;
}

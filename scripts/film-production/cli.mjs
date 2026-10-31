import { parseArgs } from "node:util";
import { prepareProject } from "./prepare.mjs";

try {
  const { values } = parseArgs({
    options: {
      manifest: { type: "string" },
      output: { type: "string" },
      help: { type: "boolean" },
    },
  });
  if (values.help) {
    console.log(
      "Usage: bun run film:prepare --manifest <local-manifest.json> --output <new-directory>\nPrepares local verified media only; never generates, approves or overwrites an edit.",
    );
  } else {
    if (!values.manifest || !values.output)
      throw new Error("Both --manifest and --output are required; use --help");
    console.log(JSON.stringify(await prepareProject(values.manifest, values.output)));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Film preparation failed");
  process.exitCode = 1;
}

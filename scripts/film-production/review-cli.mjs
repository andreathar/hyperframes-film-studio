import { parseArgs } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { createReview, applyReview, restoreReview } from "./review.mjs";
try {
  const { values } = parseArgs({
    options: {
      import: { type: "string" },
      state: { type: "string" },
      actions: { type: "string" },
      output: { type: "string" },
      help: { type: "boolean" },
    },
  });
  if (values.help)
    console.log(
      "Usage: bun run film:review --import <import.json> [--state <review.json>] [--actions <commands.json>] [--output <new-review.json>]\nPreview only by default. New output only; no creative approval, timeline edits or provider calls.",
    );
  else {
    if (!values.import) throw new Error("--import is required");
    const load = async (p) => {
      const bytes = await readFile(p);
      if (bytes.length > 32 * 1024 * 1024) throw new Error("Review input exceeds 32 MiB");
      return JSON.parse(bytes.toString("utf8"));
    };
    const bundle = await load(values.import);
    let state = createReview(bundle);
    if (values.state) {
      const supplied = await load(values.state);
      state = restoreReview(bundle, supplied);
    }
    if (values.actions) {
      const commands = await load(values.actions);
      if (!Array.isArray(commands) || commands.length > 1000)
        throw new Error("Expected action array");
      for (const c of commands) state = applyReview(bundle, state, c);
    }
    if (values.output)
      await writeFile(values.output, JSON.stringify(state, null, 2) + "\n", {
        flag: "wx",
        mode: 0o600,
      });
    console.log(JSON.stringify(state, null, 2));
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : "Review failed");
  process.exitCode = 1;
}

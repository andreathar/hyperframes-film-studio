import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { createInspectorServer } from "./inspector-server.mjs";
try {
  const { values } = parseArgs({
    options: {
      import: { type: "string" },
      state: { type: "string" },
      workspace: { type: "string" },
      port: { type: "string", default: "9362" },
      help: { type: "boolean" },
    },
  });
  if (values.help)
    console.log(
      "Usage: bun run film:inspect --import <import.json> [--state <review.json>] [--workspace <Movies_Projects>] [--port 9362]\nLocal companion inspector; session changes must be downloaded explicitly. No source or timeline writes.",
    );
  else {
    if (!values.import) throw new Error("--import is required");
    const port = Number(values.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid port");
    const load = async (path) => {
      const bytes = await readFile(path);
      if (bytes.length > 32 * 1024 * 1024) throw new Error("Inspector input exceeds 32 MiB");
      return JSON.parse(bytes.toString("utf8"));
    };
    const server = createInspectorServer({
      bundle: await load(values.import),
      state: values.state ? await load(values.state) : undefined,
      workspace: values.workspace,
    });
    server.on("error", (error) => {
      console.error(
        error.code === "EADDRINUSE"
          ? "Inspector port is occupied; choose another port"
          : "Inspector could not start",
      );
      process.exitCode = 1;
    });
    server.listen(port, "127.0.0.1", () =>
      console.log(
        `Production inspector: http://127.0.0.1:${port}\nSession changes stay in memory; download review to save. Press Ctrl+C to stop this process.`,
      ),
    );
    process.once("SIGTERM", () => server.close());
    process.once("SIGINT", () => server.close());
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Inspector failed");
  process.exitCode = 1;
}

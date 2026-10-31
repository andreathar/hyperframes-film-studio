import { accessSync, constants, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Codex readiness and argv builder.
 * Inspecting an executable path does not spawn a process and does not prove
 * authentication. `ready` comes only from an injected resolver that has already
 * qualified structured output. Live login stays unverified in this module.
 */

export interface CodexExecutableRequest {
  path: string | null;
}

export interface CodexExecutableResolution {
  state: "missing-cli" | "unauthenticated" | "unsupported-protocol" | "ready";
  evidence: string;
  executablePath: string | null;
}

export type CodexExecutableResolver = (
  request: CodexExecutableRequest,
) => CodexExecutableResolution | Promise<CodexExecutableResolution>;

export interface AssistantRunRequest {
  argv: readonly string[];
  /** Private temporary directory. Also the process working directory. */
  cwd: string;
  env: Readonly<Record<string, string>>;
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
}

export interface AssistantRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  unapprovedToolRequest?: boolean;
  inheritedMcp?: boolean;
  apiKeyInEnv?: boolean;
  interrupted?: boolean;
  quotaLimited?: boolean;
}

export type AssistantProcessRunner = (request: AssistantRunRequest) => Promise<AssistantRunResult>;

const SCENE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "SceneBrief",
  type: "object",
  additionalProperties: false,
  required: [
    "version",
    "projectId",
    "shotKey",
    "sourceRevisionId",
    "reviewRevision",
    "authoring",
    "subjects",
    "references",
    "camera",
    "setting",
    "beats",
    "dialogue",
    "sound",
    "continuity",
    "output",
  ],
};

export function resolveCodexExecutable(request: CodexExecutableRequest): CodexExecutableResolution {
  const target = request.path;
  if (!target) return missing("No Codex executable path was provided.");
  if (!executableFile(target)) {
    return missing("The Codex executable path does not name an executable file.");
  }
  return {
    state: "unauthenticated",
    evidence: `An executable is present at ${target}. Presence is not authentication.`,
    executablePath: target,
  };
}

export function createPrivateTemp(tempRoot: string, projectId: string): string {
  const safe = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/.test(projectId) ? projectId : "project";
  return mkdtempSync(join(tempRoot, `film-assistant-${safe}-`));
}

export function writeSceneSchema(tempDir: string): string {
  const path = join(tempDir, "scene-brief.schema.json");
  writeFileSync(path, `${JSON.stringify(SCENE_SCHEMA)}\n`, { encoding: "utf8", mode: 0o600 });
  return path;
}

/** Argument vector for `codex exec` structured output. Never a shell string. */
export function codexArgv(
  executablePath: string,
  tempDir: string,
  schemaPath: string,
  prompt: string,
): string[] {
  return [
    executablePath,
    "exec",
    "--json",
    "--skip-git-repo-check",
    "--sandbox",
    "read-only",
    "--cd",
    tempDir,
    "--output-schema",
    schemaPath,
    prompt,
  ];
}

function missing(evidence: string): CodexExecutableResolution {
  return { state: "missing-cli", evidence, executablePath: null };
}

function executableFile(target: string): boolean {
  try {
    if (!statSync(target).isFile()) return false;
    accessSync(target, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

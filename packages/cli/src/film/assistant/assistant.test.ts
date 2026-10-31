import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, it, vi } from "vitest";
import {
  SCENE_AUTHORING_INSTRUCTIONS,
  type AssistantContextV1,
  type AssistantEventV1,
  type AssistantPort,
  type AssistantTurnV1,
} from "@hyperframes/film-production/contracts";
import {
  resolveCodexExecutable,
  type AssistantProcessRunner,
  type AssistantRunRequest,
  type AssistantRunResult,
  type CodexExecutableResolution,
} from "./codex.js";
import { createFilmAssistantHost, type FilmAssistantHostOptions } from "./host.js";

const root = mkdtempSync(join(tmpdir(), "film-assistant-"));
const tempRoot = join(root, "tmp");
const handoffDir = join(root, "handoff");
mkdirSync(tempRoot);
mkdirSync(handoffDir);
afterAll(() => rmSync(root, { recursive: true, force: true }));

let testIds = 0;

const CAMERA_KEYS = [
  "framing",
  "angle",
  "lensIntent",
  "focusIntent",
  "opening",
  "ending",
  "path",
  "screenDirection",
  "axis",
] as const;

const SETTING_KEYS = [
  "place",
  "lightSources",
  "lightDirection",
  "materials",
  "palette",
  "atmosphere",
] as const;

const BEAT = {
  id: "beat1",
  startFrame: 0,
  endFrame: 24,
  subjectMotion: "Still",
  cameraMotion: "Locked",
  environmentMotion: "Still",
  observableEnd: "Held",
};

const DIALOGUE = [
  {
    speakerId: "ada",
    language: "pt",
    text: "Já chega — fica.",
    delivery: "Quiet",
    voiceId: "",
    startFrame: 4,
    endFrame: 20,
  },
];

const CONTINUITY = {
  locks: ["Look left"],
  allowedChanges: [],
  exclusions: ["No extra person"],
  entryAnchor: "Seated",
  exitAnchor: "Seated",
};

const OUTPUT = {
  kind: "video",
  width: 1920,
  height: 1080,
  fps: 24,
  durationFrames: 48,
  routePreference: null,
};

function testId(): string {
  testIds += 1;
  return `turn-${testIds}`;
}

function context(): AssistantContextV1 {
  return {
    projectId: "table",
    shotKey: "plan:S1",
    compositionPath: "films/table/index.html",
    selectionId: "sel-1",
    playheadFrame: 12,
    projectRevision: 4,
    sourceRevisionId: "source1",
    reviewRevision: 3,
  };
}

function words(keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, "Held"]));
}

function validBrief(ctx: AssistantContextV1): Record<string, unknown> {
  return {
    version: 1,
    projectId: ctx.projectId,
    shotKey: ctx.shotKey,
    sourceRevisionId: ctx.sourceRevisionId,
    reviewRevision: ctx.reviewRevision,
    authoring: { producer: "assistant", turnId: "model-turn", patternId: null },
    subjects: [{ id: "ada", facts: "Cast" }],
    references: [],
    camera: words(CAMERA_KEYS),
    setting: words(SETTING_KEYS),
    beats: [BEAT],
    dialogue: DIALOGUE,
    sound: { strategy: "silence", ambience: "", sfx: "", music: "" },
    continuity: CONTINUITY,
    output: OUTPUT,
  };
}

function readyResolver(): CodexExecutableResolution {
  return {
    state: "ready",
    evidence:
      "Structured output protocol is available. Authentication is not proven by this check.",
    executablePath: "/opt/codex",
  };
}

function protocolResolver(): CodexExecutableResolution {
  return {
    state: "unsupported-protocol",
    evidence: "This Codex build cannot enforce proposal-only structured output.",
    executablePath: "/opt/codex",
  };
}

function hostWith(
  runner: AssistantProcessRunner | undefined,
  overrides: Partial<FilmAssistantHostOptions> = {},
): { id: string; host: AssistantPort } {
  const generated = testId();
  const createId = overrides.createId ?? (() => generated);
  const host = createFilmAssistantHost({
    provider: "codex",
    handoffDirectory: handoffDir,
    tempRoot,
    runProcess: runner,
    resolveCodex: readyResolver,
    ...overrides,
    env: overrides.env ?? { PATH: "/usr/bin" },
    createId,
  });
  return { id: generated, host };
}

function freshDir(): string {
  const directory = join(handoffDir, testId());
  mkdirSync(directory);
  return directory;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function handoffRecord(id: string, directory: string): Record<string, unknown> {
  const value: unknown = JSON.parse(readFileSync(join(directory, `${id}-handoff.json`), "utf8"));
  if (!isRecord(value)) throw new Error("handoff was not an object");
  return value;
}

async function collect(events: AsyncIterable<AssistantEventV1>): Promise<AssistantEventV1[]> {
  const list: AssistantEventV1[] = [];
  for await (const event of events) list.push(event);
  return list;
}

function argAfter(argv: readonly string[], flag: string): string {
  const index = argv.indexOf(flag);
  const value = argv[index + 1];
  if (index < 0 || typeof value !== "string") throw new Error(`missing ${flag}`);
  return value;
}

function expectStructuredArgv(request: AssistantRunRequest, ctx: AssistantContextV1): void {
  expect(Array.isArray(request.argv)).toBe(true);
  expect(request.argv[0]).toBe("/opt/codex");
  expect(request.cwd.startsWith(tempRoot)).toBe(true);
  expect(request.cwd).toContain("film-assistant-");
  expect(argAfter(request.argv, "--cd")).toBe(request.cwd);
  expect(request.env.CODEX_HOME).toBe(request.cwd);
  expect(request.env.OPENAI_API_KEY).toBeUndefined();
  expect(Object.keys(request.env).sort()).toEqual(["CODEX_HOME", "HOME", "PATH", "TMPDIR"]);
  expect(request.argv).toContain("--sandbox");
  expect(request.argv).toContain("read-only");
  expect(request.argv).toContain("--json");
  const prompt = request.argv[request.argv.length - 1] ?? "";
  expect(prompt).toContain(SCENE_AUTHORING_INSTRUCTIONS);
  expect(prompt).toContain(JSON.stringify(ctx));
  const schemaPath = argAfter(request.argv, "--output-schema");
  expect(schemaPath.startsWith(request.cwd)).toBe(true);
  expect(readFileSync(schemaPath, "utf8")).toContain("SceneBrief");
}

async function expectProjectEvents(host: AssistantPort, id: string, secret: string): Promise<void> {
  const events = await collect(host.events(id, 0));
  expect(events.map((event) => event.kind)).toEqual([
    "status",
    "delta",
    "proposal",
    "status",
    "done",
  ]);
  expect(events.map((event) => event.sequence)).toEqual([1, 2, 3, 4, 5]);
  expect(events.every((event) => event.projectId === "table" && event.version === 1)).toBe(true);
  const stored = JSON.stringify(events);
  expect(stored).not.toContain(secret);
  expect(stored).not.toContain("foreign");
  expect(stored).toContain("kept");
  const rest = await collect(host.events(id, 1));
  expect(rest[0]?.sequence).toBe(2);
}

function successRunner(
  ctx: AssistantContextV1,
  sink: { request: AssistantRunRequest | null },
): AssistantProcessRunner {
  return async (request) => {
    sink.request = request;
    request.onChunk(JSON.stringify({ projectId: "other", text: "foreign" }));
    request.onChunk("kept sk-supersecretvalue");
    return { stdout: JSON.stringify(validBrief(ctx)), stderr: "", exitCode: 0 };
  };
}

async function runStdout(
  stdout: string,
): Promise<{ host: AssistantPort; id: string; turn: AssistantTurnV1 }> {
  const started = hostWith(async () => ({ stdout, stderr: "", exitCode: 0 }));
  const turn = await started.host.start(context(), "Hold the line");
  return { host: started.host, id: started.id, turn };
}

function failingRunner(result: AssistantRunResult): AssistantProcessRunner {
  return async () => result;
}

function pricedStdout(ctx: AssistantContextV1): string {
  const brief = validBrief(ctx);
  const camera = brief.camera;
  if (!isRecord(camera)) throw new Error("camera missing");
  return JSON.stringify({ ...brief, camera: { ...camera, framing: "Costs $12" } });
}

async function expectRunnerHandoff(flag: Partial<AssistantRunResult>): Promise<void> {
  const ctx = context();
  const runner = vi.fn(async (request: AssistantRunRequest) => {
    expect(Array.isArray(request.argv)).toBe(true);
    expect(request.cwd.startsWith(tempRoot)).toBe(true);
    expect(request.env.OPENAI_API_KEY).toBeUndefined();
    return { stdout: JSON.stringify(validBrief(ctx)), stderr: "", exitCode: 0, ...flag };
  });
  const { host, id } = hostWith(runner);
  const turn = await host.start(ctx, "Hold the line");
  expect(runner).toHaveBeenCalledOnce();
  expect(turn.status).toBe("unsupported");
  expect(turn.proposal).toBeNull();
  expect(turn.provider).toBe("codex");
  const record = handoffRecord(id, handoffDir);
  expect(record.authoringInstructions).toBe(SCENE_AUTHORING_INSTRUCTIONS);
  expect(record.instruction).toBe("Hold the line");
  expect(record.context).toEqual(ctx);
}

function cancelRunner(holder: { host: AssistantPort | null }, id: string): AssistantProcessRunner {
  return async (request) => {
    request.onChunk("early");
    const current = holder.host;
    if (!current) throw new Error("host missing");
    await current.cancel(id);
    request.onChunk("late sk-latevalue");
    expect(request.signal.aborted).toBe(true);
    return {
      stdout: JSON.stringify(validBrief(context())),
      stderr: "bearer latetoken",
      exitCode: 0,
    };
  };
}

it("checks only the given path and does not treat presence as authentication", () => {
  const executable = join(tempRoot, "codex-bin");
  const plain = join(tempRoot, "codex-plain");
  writeFileSync(executable, "#!/bin/sh\nexit 0\n");
  writeFileSync(plain, "#!/bin/sh\nexit 0\n");
  chmodSync(executable, 0o755);
  chmodSync(plain, 0o644);
  const before = process.env.PATH;
  const found = resolveCodexExecutable({ path: executable });
  expect(found.state).toBe("unauthenticated");
  expect(found.evidence).toContain("not authentication");
  expect(found.executablePath).toBe(executable);
  expect(resolveCodexExecutable({ path: plain }).state).toBe("missing-cli");
  expect(resolveCodexExecutable({ path: null }).state).toBe("missing-cli");
  expect(resolveCodexExecutable({ path: join(tempRoot, "absent") }).state).toBe("missing-cli");
  expect(process.env.PATH).toBe(before);
});

it("does not call the process runner during inspect", async () => {
  const runner = vi.fn();
  const resolveCodex = vi.fn(readyResolver);
  const { host } = hostWith(runner, { resolveCodex });
  expect(await host.inspect("codex")).toMatchObject({ provider: "codex", state: "ready" });
  expect(await host.inspect("local")).toEqual({
    provider: "local",
    state: "unavailable",
    evidence: "Local profiles are a separate module.",
  });
  const external = await host.inspect("claude-external");
  expect(external.state).toBe("external-handoff");
  expect(external.evidence.toLowerCase()).not.toContain("login");
  expect(external.evidence.toLowerCase()).not.toContain("billing");
  expect(resolveCodex).toHaveBeenCalledTimes(1);
  expect(resolveCodex).toHaveBeenCalledWith({ path: null });
  expect(runner).not.toHaveBeenCalled();
});

it("does not run codex when the binary is missing", async () => {
  const runner = vi.fn();
  const { host } = hostWith(runner, {
    resolveCodex: resolveCodexExecutable,
    codexPath: join(tempRoot, "absent-codex"),
  });
  expect(await host.inspect("codex")).toMatchObject({ state: "missing-cli" });
  const turn = await host.start(context(), "Hold the line");
  expect(runner).not.toHaveBeenCalled();
  expect(turn.status).toBe("failed");
  expect(turn.proposal).toBeNull();
});

it("does not run codex when the executable is not authenticated", async () => {
  const executable = join(tempRoot, "codex-unauth");
  writeFileSync(executable, "#!/bin/sh\nexit 0\n");
  chmodSync(executable, 0o755);
  const runner = vi.fn();
  const { host } = hostWith(runner, {
    resolveCodex: resolveCodexExecutable,
    codexPath: executable,
  });
  const readiness = await host.inspect("codex");
  expect(readiness.state).toBe("unauthenticated");
  expect(readiness.evidence).toContain("not authentication");
  const turn = await host.start(context(), "Hold the line");
  expect(runner).not.toHaveBeenCalled();
  expect(turn.status).toBe("failed");
  expect(turn.proposal).toBeNull();
});

it("hands off when the protocol is unsupported", async () => {
  const runner = vi.fn();
  const { host, id } = hostWith(runner, { resolveCodex: protocolResolver });
  expect(await host.inspect("codex")).toMatchObject({ state: "unsupported-protocol" });
  const turn = await host.start(context(), "Hold the line");
  expect(runner).not.toHaveBeenCalled();
  expect(turn.provider).toBe("codex");
  expect(turn.status).toBe("unsupported");
  expect(turn.proposal).toBeNull();
  expect(handoffRecord(id, handoffDir).authoringInstructions).toBe(SCENE_AUTHORING_INSTRUCTIONS);
});

it("returns a structured scene proposal", async () => {
  const ctx = context();
  const sink: { request: AssistantRunRequest | null } = { request: null };
  const { host, id } = hostWith(successRunner(ctx, sink));
  const turn = await host.start(ctx, "Hold the line");
  const request = sink.request;
  if (!request) throw new Error("runner was not called");
  expectStructuredArgv(request, ctx);
  expect(turn.status).toBe("proposal");
  expect(turn.proposal?.dialogue[0]?.text).toBe("Já chega — fica.");
  expect(turn.context).toEqual(ctx);
  await expectProjectEvents(host, id, "sk-supersecretvalue");
});

it("freezes context before the runner starts", async () => {
  const ctx = context();
  const stdout = JSON.stringify(validBrief(ctx));
  const { host } = hostWith(async () => ({ stdout, stderr: "", exitCode: 0 }));
  const pending = host.start(ctx, "Hold the line");
  ctx.shotKey = "changed";
  const turn = await pending;
  expect(turn.context.shotKey).toBe("plan:S1");
  expect(turn.proposal?.shotKey).toBe("plan:S1");
});

it("diagnoses invalid JSON without keeping a proposal", async () => {
  const secret = "sk-abcdef123456";
  const { host, id, turn } = await runStdout(`{ ${secret}`);
  expect(turn.proposal).toBeNull();
  expect(turn.status).toBe("failed");
  expect(turn.diagnostics[0]?.code).toBe("invalid-json");
  expect(JSON.stringify(await collect(host.events(id, 0)))).not.toContain(secret);
});

it("diagnoses a schema violation without keeping a proposal", async () => {
  const { turn } = await runStdout('{"version":1}');
  expect(turn.proposal).toBeNull();
  expect(turn.status).toBe("failed");
  expect(turn.diagnostics[0]?.code).toBe("malformed");
  expect(turn.diagnostics[0]?.path).toBe("scene.authoring");
});

it("rejects approval, price, and executable proposals", async () => {
  const ctx = context();
  const base = validBrief(ctx);
  const samples = [
    JSON.stringify({ ...base, approval: true }),
    pricedStdout(ctx),
    JSON.stringify({ ...base, executable: true }),
  ];
  for (const stdout of samples) {
    const { turn } = await runStdout(stdout);
    expect(turn.proposal).toBeNull();
    expect(turn.status).toBe("failed");
    expect(turn.diagnostics[0]?.code).toBe("rejected-proposal");
  }
});

it("drops a proposal for a different project", async () => {
  const ctx = context();
  const brief = validBrief(ctx);
  brief.projectId = "other";
  const { turn } = await runStdout(JSON.stringify(brief));
  expect(turn.proposal).toBeNull();
  expect(turn.diagnostics[0]?.code).toBe("context-mismatch");
});

it("cancels the runner and ignores later chunks", async () => {
  const id = "turn-cancel";
  const holder: { host: AssistantPort | null } = { host: null };
  const { host } = hostWith(cancelRunner(holder, id), { createId: () => id });
  holder.host = host;
  const turn = await host.start(context(), "Hold the line");
  expect(turn.status).toBe("cancelled");
  expect(turn.proposal).toBeNull();
  expect(turn.diagnostics).toEqual([]);
  const text = (await collect(host.events(id, 0))).map((event) => event.text).join("\n");
  expect(text).toContain("early");
  expect(text).not.toContain("late");
  expect(text).not.toContain("sk-latevalue");
  expect(text).not.toContain("latetoken");
});

it("records a diagnostic for a chunk that arrives after the turn closes", async () => {
  const ctx = context();
  let late: (chunk: string) => void = () => {};
  const { host, id } = hostWith(async (request) => {
    late = request.onChunk;
    return { stdout: JSON.stringify(validBrief(ctx)), stderr: "", exitCode: 0 };
  });
  const turn = await host.start(ctx, "Hold the line");
  late("late sk-latesecret");
  expect(turn.proposal?.shotKey).toBe(ctx.shotKey);
  expect(turn.diagnostics.some((item) => item.code === "late-chunk")).toBe(true);
  const stored = JSON.stringify({ turn, events: await collect(host.events(id, 0)) });
  expect(stored).not.toContain("sk-latesecret");
});

it("hands off when the environment sets an API key", async () => {
  const runner = vi.fn();
  const secret = "sk-testsecretvalue";
  const { host, id } = hostWith(runner, { env: { PATH: "/usr/bin", OPENAI_API_KEY: secret } });
  const ctx = context();
  const turn = await host.start(ctx, "Hold the line");
  expect(runner).not.toHaveBeenCalled();
  expect(turn.status).toBe("unsupported");
  expect(turn.proposal).toBeNull();
  expect(JSON.stringify(turn)).not.toContain(secret);
  const record = handoffRecord(id, handoffDir);
  expect(record.authoringInstructions).toBe(SCENE_AUTHORING_INSTRUCTIONS);
  expect(record.context).toEqual(ctx);
});

it("hands off on an unapproved tool request", async () => {
  await expectRunnerHandoff({ unapprovedToolRequest: true });
});

it("hands off when the runner reports an API key in the environment", async () => {
  await expectRunnerHandoff({ apiKeyInEnv: true });
});

it("hands off when the runner reports inherited MCP", async () => {
  await expectRunnerHandoff({ inheritedMcp: true });
});

it("redacts bearer and api_key diagnostics", async () => {
  const stderr = "bearer super-token api_key=topsecret";
  const { host, id } = hostWith(failingRunner({ stdout: "", stderr, exitCode: 2 }));
  const turn = await host.start(context(), "Hold the line");
  const stored = JSON.stringify({ turn, events: await collect(host.events(id, 0)) });
  expect(stored).not.toContain("super-token");
  expect(stored).not.toContain("topsecret");
  expect(stored).toContain("[redacted]");
});

it("records a rate limit without a proposal", async () => {
  const secret = "sk-quotasecret";
  const { host, id } = hostWith(
    failingRunner({ stdout: "{}", stderr: `limited ${secret}`, exitCode: 1, quotaLimited: true }),
  );
  const turn = await host.start(context(), "Hold the line");
  expect(turn.status).toBe("failed");
  expect(turn.proposal).toBeNull();
  expect(turn.diagnostics.some((item) => item.code === "rate-limit")).toBe(true);
  expect(JSON.stringify(await collect(host.events(id, 0)))).not.toContain(secret);
});

it("records an interruption without a proposal", async () => {
  const { host } = hostWith(
    failingRunner({ stdout: "{}", stderr: "interrupted", exitCode: null, interrupted: true }),
  );
  const turn = await host.start(context(), "Hold the line");
  expect(turn.status).toBe("failed");
  expect(turn.proposal).toBeNull();
  expect(turn.diagnostics.some((item) => item.code === "interrupted")).toBe(true);
});

it("does not spawn when no runner is configured", async () => {
  const { host, id } = hostWith(undefined);
  const turn = await host.start(context(), "Hold the line");
  expect(turn.status).toBe("unsupported");
  expect(turn.proposal).toBeNull();
  expect(handoffRecord(id, handoffDir).authoringInstructions).toBe(SCENE_AUTHORING_INSTRUCTIONS);
});

it("writes one external handoff without executing claude", async () => {
  const directory = freshDir();
  const runner = vi.fn();
  const ctx = context();
  const { host, id } = hostWith(runner, {
    provider: "claude-external",
    handoffDirectory: directory,
    responseFile: null,
  });
  const turn = await host.start(ctx, "Hold the line");
  expect(runner).not.toHaveBeenCalled();
  expect(turn.provider).toBe("claude-external");
  expect(turn.status).toBe("unsupported");
  expect(turn.proposal).toBeNull();
  expect(readdirSync(directory)).toEqual([`${id}-handoff.json`]);
  const record = handoffRecord(id, directory);
  expect(record.authoringInstructions).toBe(SCENE_AUTHORING_INSTRUCTIONS);
  expect(record.instruction).toBe("Hold the line");
  expect(record.context).toEqual(ctx);
});

it("reads an external proposal from a supplied file", async () => {
  const directory = freshDir();
  const ctx = context();
  const responseFile = join(tempRoot, `${testId()}-response.json`);
  writeFileSync(responseFile, JSON.stringify(validBrief(ctx)));
  const runner = vi.fn();
  const { host } = hostWith(runner, {
    provider: "claude-external",
    handoffDirectory: directory,
    responseFile,
  });
  const turn = await host.start(ctx, "Hold the line");
  expect(runner).not.toHaveBeenCalled();
  expect(turn.provider).toBe("claude-external");
  expect(turn.status).toBe("proposal");
  expect(turn.proposal?.dialogue[0]?.text).toBe("Já chega — fica.");
  expect(readdirSync(directory)).toHaveLength(1);
});

it("reports local profiles as a separate module", async () => {
  const runner = vi.fn();
  const { host } = hostWith(runner, { provider: "local" });
  const turn = await host.start(context(), "Hold the line");
  expect(runner).not.toHaveBeenCalled();
  expect(turn.provider).toBe("local");
  expect(turn.status).toBe("unsupported");
  expect(turn.proposal).toBeNull();
  expect(turn.diagnostics[0]?.message).toBe("Local profiles are a separate module.");
});

it("does not import a process spawner", () => {
  for (const name of ["host.ts", "codex.ts", "externalClaude.ts", "qualification.ts"]) {
    const source = readFileSync(new URL(`./${name}`, import.meta.url), "utf8");
    expect(source).not.toContain("child_process");
    expect(source).not.toContain("spawn(");
    expect(source).not.toContain("execFile");
  }
});

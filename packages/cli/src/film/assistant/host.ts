import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import type {
  AssistantContextV1,
  AssistantPort,
  AssistantProviderV1,
  AssistantReadinessV1,
  AssistantTurnV1,
  DiagnosticV1,
} from "@hyperframes/film-production/contracts";
import { authoringPrompt, freezeContext, interpretModelOutput } from "./context.js";
import {
  createPrivateTemp,
  codexArgv,
  resolveCodexExecutable,
  writeSceneSchema,
  type AssistantProcessRunner,
  type AssistantRunRequest,
  type AssistantRunResult,
  type CodexExecutableResolution,
  type CodexExecutableResolver,
} from "./codex.js";
import {
  acceptChunk,
  assistantDiagnostic,
  eventsFor,
  pushEvent,
  seal,
  type ActiveTurn,
} from "./events.js";
import { inspectExternalHandoff, writeExternalHandoff } from "./externalClaude.js";
import { isolatedProcessEnv, qualifyEnvironment, qualifyRunner } from "./qualification.js";

/**
 * Proposal-only assistant host.
 * Supported here: Codex structured output when an injected resolver reports the
 * protocol, and external file handoff. Live Codex authentication is unverified.
 * Local profiles are a separate module. This host never spawns a model itself.
 */

const LOCAL_PROFILE_EVIDENCE = "Local profiles are a separate module.";

export interface FilmAssistantHostOptions {
  provider: AssistantProviderV1;
  codexPath?: string | null;
  resolveCodex?: CodexExecutableResolver;
  runProcess?: AssistantProcessRunner;
  handoffDirectory: string;
  responseFile?: string | null;
  env?: Readonly<Record<string, string | undefined>>;
  createId?: () => string;
  tempRoot?: string;
}

let idSequence = 0;

export function createFilmAssistantHost(options: FilmAssistantHostOptions): AssistantPort {
  const turns = new Map<string, ActiveTurn>();
  return {
    inspect: (provider) => inspectAssistant(options, provider),
    start: (context, instruction) => startAssistantTurn(options, turns, context, instruction),
    events: (turnId, afterSequence) => eventsFor(turns, turnId, afterSequence),
    cancel: (turnId) => cancelTurn(turns, turnId),
  };
}

async function startAssistantTurn(
  options: FilmAssistantHostOptions,
  turns: Map<string, ActiveTurn>,
  context: AssistantContextV1,
  instruction: string,
): Promise<AssistantTurnV1> {
  const active = openTurn(options, turns, context, instruction);
  if (options.provider === "local") return finishLocal(active);
  if (options.provider === "claude-external") return finishExternal(options, active);
  if (options.provider === "codex") return finishCodex(options, active);
  return assertProvider(options.provider);
}

function openTurn(
  options: FilmAssistantHostOptions,
  turns: Map<string, ActiveTurn>,
  context: AssistantContextV1,
  instruction: string,
): ActiveTurn {
  const createId = options.createId ?? defaultCreateId;
  const active: ActiveTurn = {
    turn: {
      id: createId(),
      provider: options.provider,
      status: "streaming",
      context: freezeContext(context),
      instruction,
      proposal: null,
      diagnostics: [],
    },
    events: [],
    modelText: "",
    cancelled: false,
    closed: false,
    controller: new AbortController(),
  };
  turns.set(active.turn.id, active);
  pushEvent(active, { kind: "status", text: "streaming", proposal: null, diagnostic: null });
  return active;
}

async function finishCodex(
  options: FilmAssistantHostOptions,
  active: ActiveTurn,
): Promise<AssistantTurnV1> {
  const resolve = options.resolveCodex ?? resolveCodexExecutable;
  const resolution = await resolve({ path: options.codexPath ?? null });
  if (active.cancelled) return seal(active, "cancelled", [], null);
  const executablePath = resolution.state === "ready" ? resolution.executablePath : null;
  if (!executablePath) return blockedCodex(options, active, resolution);
  return runReadyCodex(options, active, executablePath);
}

function blockedCodex(
  options: FilmAssistantHostOptions,
  active: ActiveTurn,
  resolution: CodexExecutableResolution,
): AssistantTurnV1 {
  const item = assistantDiagnostic(resolution.state, "assistant.codex", resolution.evidence);
  if (resolution.state === "unsupported-protocol") {
    return handoffUnsupported(options, active, [item.message]);
  }
  return seal(active, "failed", [item], null);
}

async function runReadyCodex(
  options: FilmAssistantHostOptions,
  active: ActiveTurn,
  executablePath: string,
): Promise<AssistantTurnV1> {
  const ambient = qualifyEnvironment(ambientOf(options));
  if (!ambient.ok) return handoffUnsupported(options, active, ambient.reasons);
  const runner = options.runProcess;
  if (!runner) {
    return handoffUnsupported(options, active, ["Codex process runner is not configured."]);
  }
  const result = await runCaught(runner, active, launchRequest(options, active, executablePath));
  if (result.kind === "cancelled") return seal(active, "cancelled", [], null);
  if (result.kind === "error") return seal(active, "failed", [result.diagnostic], null);
  const gate = qualifyRunner(result.value);
  if (!gate.ok) return handoffUnsupported(options, active, gate.reasons);
  return applyModelResult(active, result.value);
}

function launchRequest(
  options: FilmAssistantHostOptions,
  active: ActiveTurn,
  executablePath: string,
): Omit<AssistantRunRequest, "signal" | "onChunk"> {
  const tempDir = createPrivateTemp(tempRootOf(options), active.turn.context.projectId);
  const prompt = authoringPrompt(active.turn.context, active.turn.instruction);
  const schemaPath = writeSceneSchema(tempDir);
  return {
    argv: codexArgv(executablePath, tempDir, schemaPath, prompt),
    cwd: tempDir,
    env: isolatedProcessEnv(ambientOf(options), tempDir),
  };
}

type CaughtRun =
  | { kind: "cancelled" }
  | { kind: "error"; diagnostic: DiagnosticV1 }
  | { kind: "ok"; value: AssistantRunResult };

async function runCaught(
  runner: AssistantProcessRunner,
  active: ActiveTurn,
  request: Omit<AssistantRunRequest, "signal" | "onChunk">,
): Promise<CaughtRun> {
  try {
    const value = await runner({
      ...request,
      signal: active.controller.signal,
      onChunk: (chunk) => acceptChunk(active, chunk),
    });
    if (active.cancelled) return { kind: "cancelled" };
    return { kind: "ok", value };
  } catch (error) {
    if (active.cancelled) return { kind: "cancelled" };
    const message = error instanceof Error ? error.message : "The assistant process failed.";
    return {
      kind: "error",
      diagnostic: assistantDiagnostic("process-failed", "assistant.process", message),
    };
  }
}

function applyModelResult(active: ActiveTurn, result: AssistantRunResult): AssistantTurnV1 {
  if (active.cancelled) return seal(active, "cancelled", [], null);
  const blocked = blockedResult(result);
  if (blocked) return seal(active, "failed", [blocked], null);
  const parsed = interpretModelOutput(result.stdout, active.turn.context, active.modelText);
  const status = parsed.proposal ? "proposal" : "failed";
  return seal(active, status, parsed.diagnostics, parsed.proposal);
}

function blockedResult(result: AssistantRunResult): DiagnosticV1 | null {
  if (result.quotaLimited) {
    return outcome("rate-limit", "assistant.quota", "Quota or rate limit.", result.stderr);
  }
  if (result.interrupted) {
    return outcome(
      "interrupted",
      "assistant.process",
      "The assistant process was interrupted.",
      result.stderr,
    );
  }
  if (result.exitCode !== 0) {
    return outcome(
      "process-failed",
      "assistant.process",
      "Codex exited without a proposal.",
      result.stderr,
    );
  }
  return null;
}

function outcome(code: string, path: string, fallback: string, stderr: string): DiagnosticV1 {
  const message = stderr.length > 0 ? stderr : fallback;
  return assistantDiagnostic(code, path, message);
}

function handoffUnsupported(
  options: FilmAssistantHostOptions,
  active: ActiveTurn,
  reasons: readonly string[],
): AssistantTurnV1 {
  if (active.cancelled) return seal(active, "cancelled", [], null);
  try {
    const handoff = writeExternalHandoff(
      options.handoffDirectory,
      active.turn.id,
      active.turn.context,
      active.turn.instruction,
    );
    const message = `${reasons.join(" ")} Handoff file: ${handoff.path}`;
    return seal(
      active,
      "unsupported",
      [assistantDiagnostic("external-handoff", "assistant", message)],
      null,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Handoff file could not be written.";
    return seal(
      active,
      "failed",
      [assistantDiagnostic("external-handoff", "assistant", message)],
      null,
    );
  }
}

function finishExternal(options: FilmAssistantHostOptions, active: ActiveTurn): AssistantTurnV1 {
  try {
    writeExternalHandoff(
      options.handoffDirectory,
      active.turn.id,
      active.turn.context,
      active.turn.instruction,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Handoff file could not be written.";
    return seal(
      active,
      "failed",
      [assistantDiagnostic("external-handoff", "assistant.handoff", message)],
      null,
    );
  }
  return finishSuppliedFile(options, active);
}

function finishSuppliedFile(
  options: FilmAssistantHostOptions,
  active: ActiveTurn,
): AssistantTurnV1 {
  const file = options.responseFile;
  if (!file) {
    return seal(
      active,
      "unsupported",
      [
        assistantDiagnostic(
          "external-handoff",
          "assistant.handoff",
          "No response file was supplied.",
        ),
      ],
      null,
    );
  }
  return sealFromFile(active, file);
}

function sealFromFile(active: ActiveTurn, file: string): AssistantTurnV1 {
  try {
    const parsed = interpretModelOutput(readFileSync(file, "utf8"), active.turn.context);
    const status = parsed.proposal ? "proposal" : "failed";
    return seal(active, status, parsed.diagnostics, parsed.proposal);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Response file could not be read.";
    return seal(
      active,
      "failed",
      [assistantDiagnostic("missing-response", "assistant.handoff", message)],
      null,
    );
  }
}

function finishLocal(active: ActiveTurn): AssistantTurnV1 {
  return seal(
    active,
    "unsupported",
    [assistantDiagnostic("unavailable", "assistant.local", LOCAL_PROFILE_EVIDENCE)],
    null,
  );
}

async function inspectAssistant(
  options: FilmAssistantHostOptions,
  provider: AssistantProviderV1,
): Promise<AssistantReadinessV1> {
  if (provider === "local") return inspectLocalProfile();
  if (provider === "claude-external") return inspectExternalHandoff(options.handoffDirectory);
  if (provider === "codex") return inspectCodex(options);
  return assertProvider(provider);
}

async function inspectCodex(options: FilmAssistantHostOptions): Promise<AssistantReadinessV1> {
  const resolve = options.resolveCodex ?? resolveCodexExecutable;
  const resolution = await resolve({ path: options.codexPath ?? null });
  return { provider: "codex", state: resolution.state, evidence: resolution.evidence };
}

function inspectLocalProfile(): AssistantReadinessV1 {
  return { provider: "local", state: "unavailable", evidence: LOCAL_PROFILE_EVIDENCE };
}

function ambientOf(
  options: FilmAssistantHostOptions,
): Readonly<Record<string, string | undefined>> {
  return options.env ?? process.env;
}

function tempRootOf(options: FilmAssistantHostOptions): string {
  return options.tempRoot ?? tmpdir();
}

function defaultCreateId(): string {
  idSequence += 1;
  return `turn-${idSequence}`;
}

async function cancelTurn(turns: Map<string, ActiveTurn>, turnId: string): Promise<void> {
  const active = turns.get(turnId);
  if (!active || active.closed) return;
  active.cancelled = true;
  active.controller.abort();
}

function assertProvider(provider: never): never {
  throw new Error(`Unknown assistant provider ${String(provider)}`);
}

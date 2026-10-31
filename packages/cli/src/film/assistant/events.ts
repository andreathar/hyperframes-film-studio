import type {
  AssistantEventV1,
  AssistantTurnV1,
  DiagnosticV1,
  SceneBriefV1,
} from "@hyperframes/film-production/contracts";

export interface ActiveTurn {
  turn: AssistantTurnV1;
  events: AssistantEventV1[];
  modelText: string;
  cancelled: boolean;
  closed: boolean;
  controller: AbortController;
}

interface EventDraft {
  kind: AssistantEventV1["kind"];
  text: string;
  proposal: SceneBriefV1 | null;
  diagnostic: DiagnosticV1 | null;
  projectId?: string;
}

export function assistantDiagnostic(code: string, path: string, message: string): DiagnosticV1 {
  return { code, severity: "error", path, message: redactSecrets(message) };
}

export function pushEvent(active: ActiveTurn, input: EventDraft): void {
  const projectId = input.projectId ?? active.turn.context.projectId;
  if (projectId !== active.turn.context.projectId) return;
  active.events.push({
    projectId,
    turnId: active.turn.id,
    sequence: active.events.length + 1,
    version: 1,
    kind: input.kind,
    text: redactSecrets(input.text),
    proposal: input.proposal,
    diagnostic: input.diagnostic ? redactDiagnostic(input.diagnostic) : null,
  });
}

export function acceptChunk(active: ActiveTurn, chunk: string): void {
  if (active.cancelled) return;
  if (active.closed) {
    noteLateChunk(active, chunk);
    return;
  }
  const projectId = chunkProjectId(chunk);
  if (projectId && projectId !== active.turn.context.projectId) return;
  active.modelText = `${active.modelText}${chunk}`;
  pushEvent(active, { kind: "delta", text: chunk, proposal: null, diagnostic: null });
}

export function seal(
  active: ActiveTurn,
  status: AssistantTurnV1["status"],
  diagnostics: readonly DiagnosticV1[],
  proposal: SceneBriefV1 | null,
): AssistantTurnV1 {
  active.closed = true;
  active.turn.status = status;
  active.turn.proposal = proposal;
  active.turn.diagnostics = diagnostics.map(redactDiagnostic);
  emitDiagnostics(active);
  if (proposal) emitProposal(active, proposal);
  emitTerminal(active, status);
  return active.turn;
}

export function eventsFor(
  turns: ReadonlyMap<string, ActiveTurn>,
  turnId: string,
  afterSequence: number,
): AsyncIterable<AssistantEventV1> {
  const active = turns.get(turnId);
  if (!active) return iterateEvents([], afterSequence, null);
  return iterateEvents(active.events, afterSequence, active.turn.context.projectId);
}

function noteLateChunk(active: ActiveTurn, chunk: string): void {
  const projectId = chunkProjectId(chunk);
  if (projectId && projectId !== active.turn.context.projectId) return;
  const item = assistantDiagnostic(
    "late-chunk",
    "assistant.events",
    `Late chunk ignored: ${chunk}`,
  );
  active.turn.diagnostics = [...active.turn.diagnostics, item];
  pushEvent(active, { kind: "diagnostic", text: item.message, proposal: null, diagnostic: item });
}

function emitDiagnostics(active: ActiveTurn): void {
  for (const item of active.turn.diagnostics) {
    pushEvent(active, { kind: "diagnostic", text: item.message, proposal: null, diagnostic: item });
  }
}

function emitProposal(active: ActiveTurn, proposal: SceneBriefV1): void {
  pushEvent(active, { kind: "proposal", text: "proposal", proposal, diagnostic: null });
}

function emitTerminal(active: ActiveTurn, status: AssistantTurnV1["status"]): void {
  pushEvent(active, { kind: "status", text: status, proposal: null, diagnostic: null });
  pushEvent(active, { kind: "done", text: status, proposal: null, diagnostic: null });
}

function redactDiagnostic(item: DiagnosticV1): DiagnosticV1 {
  return { ...item, message: redactSecrets(item.message) };
}

export function redactSecrets(text: string): string {
  return text.replace(
    /sk-[A-Za-z0-9_-]{4,}|bearer\s+[A-Za-z0-9._~+/-]+|api_key\s*[=:]\s*["']?[A-Za-z0-9._~+/-]+/gi,
    "[redacted]",
  );
}

function chunkProjectId(chunk: string): string | null {
  try {
    const value: unknown = JSON.parse(chunk);
    if (!isRecord(value)) return null;
    const projectId = value.projectId;
    return typeof projectId === "string" ? projectId : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function* iterateEvents(
  events: readonly AssistantEventV1[],
  afterSequence: number,
  projectId: string | null,
): AsyncGenerator<AssistantEventV1> {
  for (const event of events) {
    if (event.sequence <= afterSequence) continue;
    if (projectId && event.projectId !== projectId) continue;
    yield event;
  }
}

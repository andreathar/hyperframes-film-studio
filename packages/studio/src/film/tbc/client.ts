import { studioApiFetch } from "../../utils/studioApiFetch";
import type {
  TbcApplyResult,
  TbcHealth,
  TbcIssue,
  TbcShotContextV1,
  TbcShotRow,
  TbcTurnV1,
} from "./types";

/** Where `tbc serve` listens unless `VITE_TBC_URL` says otherwise (tbc-forge's default port). */
export const DEFAULT_TBC_URL = "http://127.0.0.1:4317";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** `import.meta.env` may be missing outside Vite; a missing or blank value means the default. */
export function tbcBaseUrl(): string {
  try {
    const value: unknown = import.meta.env.VITE_TBC_URL;
    if (typeof value === "string" && value.trim() !== "") return value.trim().replace(/\/+$/, "");
  } catch {
    // Not running under Vite.
  }
  return DEFAULT_TBC_URL;
}

/** A refusal from `tbc serve`, with its HTTP status and, for a 422, the issues that block it. */
export class TbcError extends Error {
  readonly status: number;
  readonly issues: readonly TbcIssue[];
  constructor(status: number, message: string, issues: readonly TbcIssue[] = []) {
    super(message);
    this.name = "TbcError";
    this.status = status;
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIssue(value: unknown): value is TbcIssue {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    (value.severity === "error" || value.severity === "warning" || value.severity === "info")
  );
}

function isHealth(value: unknown): value is TbcHealth {
  return (
    isRecord(value) &&
    value.ok === true &&
    typeof value.manifest === "string" &&
    typeof value.csrf === "string" &&
    isRecord(value.assistant) &&
    typeof value.assistant.available === "boolean"
  );
}

function isShotRows(value: unknown): value is TbcShotRow[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) => isRecord(row) && typeof row.id === "string" && typeof row.status === "string",
    )
  );
}

function isContext(value: unknown): value is TbcShotContextV1 {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.revision === "string" &&
    isRecord(value.shot) &&
    typeof value.shot.id === "string" &&
    Array.isArray(value.continuity) &&
    Array.isArray(value.prompt) &&
    Array.isArray(value.issues)
  );
}

function isTurn(value: unknown): value is TbcTurnV1 {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.revision === "string" &&
    typeof value.state === "string" &&
    Array.isArray(value.events) &&
    Array.isArray(value.proposals)
  );
}

function isApplyResult(value: unknown): value is TbcApplyResult {
  return (
    isRecord(value) &&
    isRecord(value.applied) &&
    typeof value.applied.kind === "string" &&
    (value.context === null || isContext(value.context))
  );
}

async function body(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function refusal(status: number, payload: unknown): TbcError {
  if (!isRecord(payload) || typeof payload.error !== "string") {
    return new TbcError(status, `tbc serve answered ${status}`);
  }
  const issues = Array.isArray(payload.issues) ? payload.issues.filter(isIssue) : [];
  return new TbcError(status, payload.error, issues);
}

/**
 * Every route of `tbc serve`. GETs need nothing; each POST carries the per-start CSRF token from
 * `/api/health`, so `health()` must answer before a POST is sent.
 */
export interface TbcClient {
  readonly baseUrl: string;
  health(): Promise<TbcHealth>;
  shots(): Promise<TbcShotRow[]>;
  context(shotId: string): Promise<TbcShotContextV1>;
  lookMediaUrl(entity: string, view: string): string;
  startTurn(input: { shotId: string; instruction: string; revision: string }): Promise<TbcTurnV1>;
  turn(id: string, after?: number): Promise<TbcTurnV1>;
  cancel(id: string): Promise<TbcTurnV1>;
  apply(turnId: string, index: number, revision: string): Promise<TbcApplyResult>;
}

export function tbcClient(
  baseUrl: string = tbcBaseUrl(),
  fetcher: FetchLike = studioApiFetch,
): TbcClient {
  let csrf: string | null = null;

  async function get<T>(path: string, guard: (value: unknown) => value is T): Promise<T> {
    const response = await fetcher(`${baseUrl}${path}`, {
      headers: { accept: "application/json" },
    });
    const payload = await body(response);
    if (!response.ok) throw refusal(response.status, payload);
    if (!guard(payload)) throw new TbcError(response.status, `unexpected answer from ${path}`);
    return payload;
  }

  async function post<T>(
    path: string,
    payload: object,
    guard: (value: unknown) => value is T,
  ): Promise<T> {
    if (csrf === null) throw new TbcError(0, "tbc serve has not answered /api/health yet");
    const response = await fetcher(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-tbc-csrf": csrf },
      body: JSON.stringify(payload),
    });
    const answer = await body(response);
    if (!response.ok) throw refusal(response.status, answer);
    if (!guard(answer)) throw new TbcError(response.status, `unexpected answer from ${path}`);
    return answer;
  }

  const enc = encodeURIComponent;
  return {
    baseUrl,
    async health() {
      const health = await get("/api/health", isHealth);
      csrf = health.csrf;
      return health;
    },
    shots: () => get("/api/shots", isShotRows),
    context: (shotId) => get(`/api/shots/${enc(shotId)}/context`, isContext),
    lookMediaUrl: (entity, view) => `${baseUrl}/api/media/look/${enc(entity)}/${enc(view)}`,
    startTurn: (input) => post("/api/assistant/turns", input, isTurn),
    turn: (id, after = 0) => get(`/api/assistant/turns/${enc(id)}?after=${after}`, isTurn),
    cancel: (id) => post(`/api/assistant/turns/${enc(id)}/cancel`, {}, isTurn),
    apply: (turnId, index, revision) =>
      post(
        `/api/assistant/turns/${enc(turnId)}/proposals/${index}/apply`,
        { revision },
        isApplyResult,
      ),
  };
}

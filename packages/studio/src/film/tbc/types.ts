/**
 * The wire shapes of `tbc serve` (tbc-forge), copied by hand: Studio never imports tbc-forge.
 * Sources: packages/core/src/context/shot-context.ts (ShotContextV1), packages/core/src/issues.ts,
 * packages/core/src/assistant/proposal.ts (ProposalV1, CheckedProposal),
 * packages/cli/src/assistant/turns.ts (TurnV1), packages/cli/src/serve/{routes,apply}.ts.
 */

export type TbcSeverity = "error" | "warning" | "info";

export interface TbcIssue {
  code: string;
  severity: TbcSeverity;
  where: string;
  message: string;
  hint?: string;
}

export interface TbcPromptSegment {
  text: string;
  source: string;
}

export type TbcLookState = "locked" | "drift" | "incomplete" | "none";

export type TbcShotStatus = string;

export interface TbcContextEntity {
  code: string;
  kind: string;
  displayName: string;
  inFrame: boolean;
  state: TbcLookState;
  views: { name: string; path?: string; sha256?: string }[];
}

export interface TbcNeighbour {
  id: string;
  beat?: string;
  status: TbcShotStatus;
}

export interface TbcShotContextV1 {
  version: 1;
  shot: {
    id: string;
    chapter: string;
    beat?: string;
    feeling?: string;
    eyeline?: "camera-left" | "camera-right";
    seconds: number;
    description: string;
    status: TbcShotStatus;
    lines: { id: string; speaker: string; text: string }[];
  };
  neighbours: { previous?: TbcNeighbour; next?: TbcNeighbour };
  continuity: TbcContextEntity[];
  presets: { camera?: string; acting?: string; shot?: string; dialogue?: string };
  prompt: TbcPromptSegment[];
  duration?: unknown;
  issues: TbcIssue[];
  revision: string;
}

export interface TbcShotRow {
  id: string;
  chapter: string;
  beat: string | null;
  feeling: string | null;
  status: TbcShotStatus;
  ready: boolean;
}

export interface TbcHealth {
  ok: boolean;
  manifest: string;
  version: string;
  csrf: string;
  assistant: { available: boolean; reason?: string };
}

export type TbcProposal =
  | { kind: "preset-edit"; preset: string; field: string; from: string; to: string; why: string }
  | { kind: "look-draft"; entity: string; view: string; count: number; why: string }
  | { kind: "batch-draft"; chapter: string; why: string }
  | { kind: "note"; text: string };

export interface TbcCheckedProposal {
  proposal: TbcProposal;
  applicable: boolean;
  issues: TbcIssue[];
  preview?: { shotId: string; prompt: TbcPromptSegment[] };
}

export type TbcTurnEvent =
  | { kind: "status"; text: string }
  | { kind: "delta"; text: string }
  | { kind: "result"; reply: string }
  | { kind: "error"; message: string };

export type TbcTurnState = "running" | "done" | "error" | "cancelled";

export interface TbcTurnV1 {
  id: string;
  shotId: string;
  revision: string;
  instruction: string;
  state: TbcTurnState;
  events: TbcTurnEvent[];
  reply?: string;
  proposals: TbcCheckedProposal[];
  startedAt: string;
  endedAt?: string;
  error?: string;
}

export type TbcApplied =
  | { kind: "preset-edited"; preset: string; field: string; file: string }
  | { kind: "looks-drafted"; files: string[] };

export interface TbcApplyResult {
  applied: TbcApplied;
  context: TbcShotContextV1 | null;
}

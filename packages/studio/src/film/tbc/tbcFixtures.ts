import type { TbcClient } from "./client";
import { TbcError } from "./client";
import type {
  TbcApplyResult,
  TbcCheckedProposal,
  TbcHealth,
  TbcShotContextV1,
  TbcShotRow,
  TbcTurnV1,
} from "./types";

export const HEALTH: TbcHealth = {
  ok: true,
  manifest: "tbc",
  version: "0.1.0",
  csrf: "csrf-token-1",
  assistant: { available: true },
};

export const ROWS: TbcShotRow[] = [
  { id: "G-01", chapter: "G", beat: "E1", feeling: null, status: "planned", ready: true },
  { id: "G-02", chapter: "G", beat: "E2", feeling: "pride", status: "planned", ready: false },
];

export const CONTEXT: TbcShotContextV1 = {
  version: 1,
  shot: {
    id: "G-02",
    chapter: "G",
    beat: "E2",
    feeling: "pride -> restraint",
    eyeline: "camera-left",
    seconds: 5,
    description: "Galileo answers, back to camera.",
    status: "planned",
    lines: [{ id: "G-L02", speaker: "GALILEO", text: "And yet it moves." }],
  },
  neighbours: { previous: { id: "G-01", beat: "E1", status: "planned" } },
  continuity: [
    {
      code: "GALILEO",
      kind: "character",
      displayName: "Galileo",
      inFrame: true,
      state: "locked",
      views: [{ name: "back", path: "looks/GALILEO_back.png", sha256: "abc" }],
    },
    {
      code: "TABLE",
      kind: "prop",
      displayName: "The table",
      inFrame: true,
      state: "none",
      views: [{ name: "front" }],
    },
  ],
  presets: { acting: "acting/answer", shot: "shot/G-02" },
  prompt: [
    { text: "Medium shot from behind.", source: "camera/medium#framing" },
    { text: "A chair creaks once.", source: "acting/answer#sound" },
  ],
  issues: [
    {
      code: "look-missing",
      severity: "error",
      where: "TABLE",
      message: "TABLE has no locked look.",
      hint: "tbc looks draft",
    },
  ],
  revision: "rev-1-aaaaaaaa",
};

export const PRESET_EDIT: TbcCheckedProposal = {
  proposal: {
    kind: "preset-edit",
    preset: "acting/answer",
    field: "sound",
    from: "A chair creaks once.",
    to: "Silence, then a chair creaks.",
    why: "Restraint before the line.",
  },
  applicable: true,
  issues: [],
  preview: {
    shotId: "G-02",
    prompt: [{ text: "Silence, then a chair creaks.", source: "acting/answer#sound" }],
  },
};

export const BATCH: TbcCheckedProposal = {
  proposal: { kind: "batch-draft", chapter: "G", why: "Chapter is ready." },
  applicable: false,
  issues: [],
};

export const TURN: TbcTurnV1 = {
  id: "t1",
  shotId: "G-02",
  revision: CONTEXT.revision,
  instruction: "quieter",
  state: "running",
  events: [{ kind: "status", text: "Reading the shot…" }],
  proposals: [],
  startedAt: "2026-11-01T10:00:00.000Z",
};

/** A scripted in-memory tbc serve; each call is recorded. */
export function fakeTbc(options: {
  health?: TbcHealth | Error;
  turns?: TbcTurnV1[];
  apply?: TbcApplyResult | TbcError;
  context?: TbcShotContextV1;
}) {
  const calls: string[] = [];
  const turns = [...(options.turns ?? [])];
  let last: TbcTurnV1 | undefined;
  // Scripted turns answer for whichever shot the turn was started on.
  let shotId: string | undefined;
  const next = (): TbcTurnV1 => {
    last = turns.shift() ?? last;
    if (last === undefined) throw new Error("no scripted turn");
    return shotId === undefined ? last : { ...last, shotId };
  };
  const client: TbcClient = {
    baseUrl: "http://tbc.test",
    async health() {
      calls.push("health");
      const health = options.health ?? HEALTH;
      if (health instanceof Error) throw health;
      return health;
    },
    async shots() {
      calls.push("shots");
      return ROWS;
    },
    async context(id) {
      calls.push(`context ${id}`);
      return {
        ...(options.context ?? CONTEXT),
        shot: { ...(options.context ?? CONTEXT).shot, id },
      };
    },
    lookMediaUrl: (entity, view) => `http://tbc.test/api/media/look/${entity}/${view}`,
    async startTurn(input) {
      calls.push(`start ${input.shotId} ${input.revision} ${input.instruction}`);
      shotId = input.shotId;
      return next();
    },
    async turn(id, after) {
      calls.push(`turn ${id} after=${after ?? 0}`);
      const turn = next();
      return { ...turn, events: turn.events.slice(after ?? 0) };
    },
    async cancel(id) {
      calls.push(`cancel ${id}`);
      return { ...next(), state: "cancelled" };
    },
    async apply(turnId, index, revision) {
      calls.push(`apply ${turnId} ${index} ${revision}`);
      const result = options.apply;
      if (result === undefined) throw new TbcError(500, "no scripted apply");
      if (result instanceof TbcError) throw result;
      return result;
    },
  };
  return { client, calls };
}

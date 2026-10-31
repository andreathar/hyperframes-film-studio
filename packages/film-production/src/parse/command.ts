import type { FilmActionV1, FilmCommandV1 } from "../model.js";
import {
  FilmContractError,
  isRecord,
  objectAt,
  oneOf,
  readInt,
  readProducerId,
  readShotKey,
  readString,
} from "./common.js";
import { parseSceneBrief } from "./scene.js";
import {
  assertRegistrationDoesNotSelect,
  parseAttempt,
  parseCandidate,
  parseReceipt,
  parseSourceRevision,
} from "./records.js";

const ACTION_TYPES = [
  "save-scene-draft",
  "register-candidate",
  "create-attempt",
  "record-provider-receipt",
  "select-candidate",
  "record-source-revision",
  "revalidate-proposals",
] as const;

type ActionType = (typeof ACTION_TYPES)[number];

function saveSceneDraft(value: unknown): FilmActionV1 {
  const record = objectAt(value, "command.action", ["type", "brief"]);
  return { type: "save-scene-draft", brief: parseSceneBrief(record.brief) };
}

function registerCandidate(value: unknown): FilmActionV1 {
  const record = objectAt(value, "command.action", ["type", "candidate"]);
  const candidate = parseCandidate(record.candidate, "command.action.candidate");
  assertRegistrationDoesNotSelect(candidate, "command.action.candidate");
  return { type: "register-candidate", candidate };
}

function createAttempt(value: unknown): FilmActionV1 {
  const record = objectAt(value, "command.action", ["type", "attempt"]);
  return {
    type: "create-attempt",
    attempt: parseAttempt(record.attempt, "command.action.attempt"),
  };
}

function recordReceipt(value: unknown): FilmActionV1 {
  const record = objectAt(value, "command.action", ["type", "receipt"]);
  return {
    type: "record-provider-receipt",
    receipt: parseReceipt(record.receipt, "command.action.receipt"),
  };
}

function selectCandidate(value: unknown): FilmActionV1 {
  const record = objectAt(value, "command.action", ["type", "candidateId", "shotKey"]);
  return {
    type: "select-candidate",
    candidateId: readProducerId(record, "command.action", "candidateId"),
    shotKey: readShotKey(record, "command.action", "shotKey"),
  };
}

function recordSourceRevision(value: unknown): FilmActionV1 {
  const record = objectAt(value, "command.action", ["type", "revision"]);
  return {
    type: "record-source-revision",
    revision: parseSourceRevision(record.revision, "command.action.revision"),
  };
}

function revalidateProposals(value: unknown): FilmActionV1 {
  const record = objectAt(value, "command.action", ["type", "shotKey"]);
  return {
    type: "revalidate-proposals",
    shotKey: readShotKey(record, "command.action", "shotKey"),
  };
}

const actionByType: Record<ActionType, (value: unknown) => FilmActionV1> = {
  "save-scene-draft": saveSceneDraft,
  "register-candidate": registerCandidate,
  "create-attempt": createAttempt,
  "record-provider-receipt": recordReceipt,
  "select-candidate": selectCandidate,
  "record-source-revision": recordSourceRevision,
  "revalidate-proposals": revalidateProposals,
};

function parseAction(value: unknown): FilmActionV1 {
  if (!isRecord(value)) {
    throw new FilmContractError("malformed", "command.action", "command.action must name a type");
  }
  return actionByType[oneOf(value.type, "command.action.type", ACTION_TYPES)](value);
}

export function parseFilmCommand(value: unknown): FilmCommandV1 {
  const record = objectAt(value, "command", [
    "requestId",
    "projectId",
    "expectedProjectRevision",
    "reason",
    "action",
  ]);
  return {
    requestId: readProducerId(record, "command", "requestId"),
    projectId: readProducerId(record, "command", "projectId"),
    expectedProjectRevision: readInt(record, "command", "expectedProjectRevision", {
      min: 0,
      max: 1_000_000,
    }),
    reason: readString(record, "command", "reason", { required: true, max: 2000 }),
    action: parseAction(record.action),
  };
}

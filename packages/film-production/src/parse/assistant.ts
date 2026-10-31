import type { AssistantContextV1 } from "../model.js";
import {
  FilmContractError,
  objectAt,
  readInt,
  readNullableInt,
  readProducerId,
  readProjectRelativePath,
  readShotKey,
} from "./common.js";

function optionalString(value: unknown, fieldPath: string, max: number): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > max) {
    throw new FilmContractError("invalid", fieldPath, `${fieldPath} is invalid`);
  }
  return value;
}

export function parseAssistantContext(value: unknown): AssistantContextV1 {
  const record = objectAt(value, "assistantContext", [
    "projectId",
    "shotKey",
    "compositionPath",
    "selectionId",
    "playheadFrame",
    "projectRevision",
    "sourceRevisionId",
    "reviewRevision",
  ]);
  return {
    projectId: readProducerId(record, "assistantContext", "projectId"),
    shotKey: readShotKey(record, "assistantContext", "shotKey"),
    compositionPath:
      record.compositionPath === null
        ? null
        : readProjectRelativePath(record, "assistantContext", "compositionPath"),
    selectionId: optionalString(record.selectionId, "assistantContext.selectionId", 200),
    playheadFrame: readNullableInt(record, "assistantContext", "playheadFrame", {
      min: 0,
      max: 120 * 3600,
    }),
    projectRevision: readInt(record, "assistantContext", "projectRevision", {
      min: 0,
      max: 1_000_000,
    }),
    sourceRevisionId: readProducerId(record, "assistantContext", "sourceRevisionId"),
    reviewRevision: readInt(record, "assistantContext", "reviewRevision", {
      min: 0,
      max: 1_000_000,
    }),
  };
}

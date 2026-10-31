import type { AttemptV1, CandidateV1, ProviderReceiptV1, SourceRevisionV1 } from "../model.js";
import { PROVIDER_ROUTES } from "../model.js";
import {
  FilmContractError,
  mapNamedFields,
  objectAt,
  oneOf,
  readBoolean,
  readHash,
  readInt,
  readNullableInt,
  readOptionalHash,
  readProducerId,
  readProjectRelativePath,
  readShotKey,
  readString,
} from "./common.js";

const MEDIA = ["image", "video", "audio"] as const;
const CANDIDATE_ROUTES = [...PROVIDER_ROUTES, "owned-media"] as const;
const ATTEMPT_STATUS = ["prepared", "released", "unknown", "failed", "succeeded"] as const;
const RECEIPT_STATUS = [
  "unknown",
  "reported-running",
  "reported-failed",
  "reported-succeeded",
] as const;

function stringRecord(value: unknown, fieldPath: string): Record<string, string> | null {
  if (value === null) return null;
  return mapNamedFields(value, fieldPath, 40, "metadata fields", (key, item) => {
    if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(key) || typeof item !== "string" || item.length > 2000) {
      throw new FilmContractError(
        "invalid",
        `${fieldPath}.${key}`,
        "Image metadata must be short text",
      );
    }
    return item;
  });
}

export function parseCandidate(value: unknown, fieldPath: string): CandidateV1 {
  const record = objectAt(value, fieldPath, [
    "id",
    "projectId",
    "shotKey",
    "attemptId",
    "jobId",
    "kind",
    "sha256",
    "mediaPath",
    "width",
    "height",
    "fps",
    "durationFrames",
    "imageMetadata",
    "firstFrameSha256",
    "selected",
    "accepted",
    "provenance",
  ]);
  const provenance = objectAt(record.provenance, `${fieldPath}.provenance`, [
    "route",
    "receiptId",
    "originalOutputId",
  ]);
  const mediaPath = readProjectRelativePath(record, fieldPath, "mediaPath");
  return {
    id: readProducerId(record, fieldPath, "id"),
    projectId: readProducerId(record, fieldPath, "projectId"),
    shotKey: readShotKey(record, fieldPath, "shotKey"),
    attemptId: readNullableId(record, fieldPath, "attemptId"),
    jobId: readNullableId(record, fieldPath, "jobId"),
    kind: oneOf(record.kind, `${fieldPath}.kind`, MEDIA),
    sha256: readHash(record, fieldPath, "sha256"),
    mediaPath,
    width: readNullableInt(record, fieldPath, "width", { min: 1, max: 16384 }),
    height: readNullableInt(record, fieldPath, "height", { min: 1, max: 16384 }),
    fps: readNullableInt(record, fieldPath, "fps", { min: 1, max: 120 }),
    durationFrames: readNullableInt(record, fieldPath, "durationFrames", {
      min: 1,
      max: 120 * 3600,
    }),
    imageMetadata: stringRecord(record.imageMetadata, `${fieldPath}.imageMetadata`),
    firstFrameSha256: readOptionalHash(record, fieldPath, "firstFrameSha256"),
    selected: readBoolean(record, fieldPath, "selected"),
    accepted: readBoolean(record, fieldPath, "accepted"),
    provenance: {
      route: oneOf(provenance.route, `${fieldPath}.provenance.route`, CANDIDATE_ROUTES),
      receiptId: readNullableId(provenance, `${fieldPath}.provenance`, "receiptId"),
      originalOutputId: readString(provenance, `${fieldPath}.provenance`, "originalOutputId", {
        required: true,
        allowEmpty: true,
        max: 200,
      }),
    },
  };
}

function readNullableId(
  record: Record<string, unknown>,
  fieldPath: string,
  key: string,
): string | null {
  const value = record[key];
  if (value === null) return null;
  return readProducerId(record, fieldPath, key);
}

export function parseAttempt(value: unknown, fieldPath: string): AttemptV1 {
  const record = objectAt(value, fieldPath, [
    "id",
    "jobId",
    "projectRevision",
    "compilationSha256",
    "canonicalPayloadSha256",
    "schemaDigest",
    "status",
    "nativeTaskId",
    "reason",
    "supersedesAttemptId",
  ]);
  return {
    id: readProducerId(record, fieldPath, "id"),
    jobId: readProducerId(record, fieldPath, "jobId"),
    projectRevision: readInt(record, fieldPath, "projectRevision", { min: 0, max: 1_000_000 }),
    compilationSha256: readHash(record, fieldPath, "compilationSha256"),
    canonicalPayloadSha256: readOptionalHash(record, fieldPath, "canonicalPayloadSha256"),
    schemaDigest: readOptionalHash(record, fieldPath, "schemaDigest"),
    status: oneOf(record.status, `${fieldPath}.status`, ATTEMPT_STATUS),
    nativeTaskId: readNullableId(record, fieldPath, "nativeTaskId"),
    reason: readString(record, fieldPath, "reason", { required: true, max: 2000 }),
    supersedesAttemptId: readNullableId(record, fieldPath, "supersedesAttemptId"),
  };
}

export function parseReceipt(value: unknown, fieldPath: string): ProviderReceiptV1 {
  const record = objectAt(value, fieldPath, [
    "id",
    "attemptId",
    "route",
    "status",
    "nativeTaskId",
    "traceId",
    "outputSha256",
    "evidencePath",
  ]);
  const evidencePath =
    record.evidencePath === null
      ? null
      : readProjectRelativePath(record, fieldPath, "evidencePath");
  return {
    id: readProducerId(record, fieldPath, "id"),
    attemptId: readProducerId(record, fieldPath, "attemptId"),
    route: oneOf(record.route, `${fieldPath}.route`, PROVIDER_ROUTES),
    status: oneOf(record.status, `${fieldPath}.status`, RECEIPT_STATUS),
    nativeTaskId: readNullableId(record, fieldPath, "nativeTaskId"),
    traceId: readNullableId(record, fieldPath, "traceId"),
    outputSha256: readOptionalHash(record, fieldPath, "outputSha256"),
    evidencePath,
  };
}

export function parseSourceRevision(value: unknown, fieldPath: string): SourceRevisionV1 {
  const record = objectAt(value, fieldPath, ["id", "fingerprint", "importedAt", "note"]);
  const importedAt = readString(record, fieldPath, "importedAt", { required: true, max: 40 });
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(importedAt)) {
    throw new FilmContractError(
      "invalid",
      `${fieldPath}.importedAt`,
      "importedAt must be UTC ISO-8601",
    );
  }
  return {
    id: readProducerId(record, fieldPath, "id"),
    fingerprint: readHash(record, fieldPath, "fingerprint"),
    importedAt,
    note: readString(record, fieldPath, "note", { required: true, allowEmpty: true, max: 2000 }),
  };
}

export function assertRegistrationDoesNotSelect(candidate: CandidateV1, fieldPath: string): void {
  if (candidate.selected || candidate.accepted) {
    throw new FilmContractError(
      "invalid",
      fieldPath,
      "Registration cannot select or accept a candidate",
    );
  }
}

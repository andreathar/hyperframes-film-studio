import type { CapabilityModelV1, CapabilitySnapshotV1, CapabilitySlotV1 } from "../model.js";
import {
  FilmContractError,
  mapNamedFields,
  objectAt,
  oneOf,
  readHash,
  readInt,
  readString,
} from "./common.js";

const MEDIA = ["image", "video", "audio"] as const;

function resolutions(value: unknown, fieldPath: string): Array<{ width: number; height: number }> {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    throw new FilmContractError("malformed", fieldPath, `${fieldPath} must list resolutions`);
  }
  return value.map((item, index) => {
    const path = `${fieldPath}.${index}`;
    const record = objectAt(item, path, ["width", "height"]);
    return {
      width: readInt(record, path, "width", { min: 1, max: 16384 }),
      height: readInt(record, path, "height", { min: 1, max: 16384 }),
    };
  });
}

function numberList(value: unknown, fieldPath: string, max: number): number[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 40) {
    throw new FilmContractError("malformed", fieldPath, `${fieldPath} must be a short number list`);
  }
  return value.map((item, index) => {
    if (typeof item !== "number" || !Number.isInteger(item) || item < 1 || item > max) {
      throw new FilmContractError(
        "invalid",
        `${fieldPath}.${index}`,
        `${fieldPath}.${index} is out of range`,
      );
    }
    return item;
  });
}

function stringList(value: unknown, fieldPath: string): string[] {
  if (!Array.isArray(value) || value.length > 40) {
    throw new FilmContractError("malformed", fieldPath, `${fieldPath} must be a short string list`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || item.length === 0 || item.length > 80) {
      throw new FilmContractError(
        "invalid",
        `${fieldPath}.${index}`,
        `${fieldPath}.${index} must be text`,
      );
    }
    return item;
  });
}

function enums(value: unknown, fieldPath: string): Record<string, string[]> {
  return mapNamedFields(value, fieldPath, 40, "enums", (key, item) => {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,40}$/.test(key)) {
      throw new FilmContractError("invalid", `${fieldPath}.${key}`, "Enum name is invalid");
    }
    return stringList(item, `${fieldPath}.${key}`);
  });
}

function requiredFlag(value: unknown, fieldPath: string): boolean {
  if (typeof value === "boolean") return value;
  throw new FilmContractError("invalid", fieldPath, `${fieldPath} must be boolean`);
}

function slots(value: unknown, fieldPath: string): CapabilitySlotV1[] {
  if (!Array.isArray(value) || value.length > 16) {
    throw new FilmContractError("malformed", fieldPath, `${fieldPath} must list slots`);
  }
  return value.map((item, index) => {
    const path = `${fieldPath}.${index}`;
    const record = objectAt(item, path, ["name", "mediaKinds", "required"]);
    const mediaValue = record.mediaKinds;
    if (!Array.isArray(mediaValue) || mediaValue.length === 0) {
      throw new FilmContractError("malformed", `${path}.mediaKinds`, "A slot needs a media kind");
    }
    return {
      name: readString(record, path, "name", { required: true, max: 80 }),
      mediaKinds: mediaValue.map((kind, kindIndex) =>
        oneOf(kind, `${path}.mediaKinds.${kindIndex}`, MEDIA),
      ),
      required: requiredFlag(record.required, `${path}.required`),
    };
  });
}

function model(value: unknown, fieldPath: string): CapabilityModelV1 {
  const record = objectAt(value, fieldPath, [
    "id",
    "durationFrames",
    "ratios",
    "resolutions",
    "counts",
    "enums",
    "slots",
    "maxReferences",
    "unsupportedCombinations",
  ]);
  const combinations = record.unsupportedCombinations;
  if (!Array.isArray(combinations) || combinations.length > 40) {
    throw new FilmContractError(
      "malformed",
      `${fieldPath}.unsupportedCombinations`,
      "Invalid combinations",
    );
  }
  return {
    id: readString(record, fieldPath, "id", { required: true, max: 120 }),
    durationFrames: numberList(record.durationFrames, `${fieldPath}.durationFrames`, 120 * 3600),
    ratios: stringList(record.ratios, `${fieldPath}.ratios`),
    resolutions: resolutions(record.resolutions, `${fieldPath}.resolutions`),
    counts: numberList(record.counts, `${fieldPath}.counts`, 8),
    enums: enums(record.enums, `${fieldPath}.enums`),
    slots: slots(record.slots, `${fieldPath}.slots`),
    maxReferences: readInt(record, fieldPath, "maxReferences", { min: 0, max: 16 }),
    unsupportedCombinations: combinations.map((item, index) => {
      const path = `${fieldPath}.unsupportedCombinations.${index}`;
      const combination = objectAt(item, path, ["sound", "motion", "reason"]);
      return {
        sound: readString(combination, path, "sound", {
          required: true,
          allowEmpty: true,
          max: 80,
        }),
        motion: readString(combination, path, "motion", {
          required: true,
          allowEmpty: true,
          max: 80,
        }),
        reason: readString(combination, path, "reason", { required: true, max: 500 }),
      };
    }),
  };
}

export function parseCapabilitySnapshot(value: unknown): CapabilitySnapshotV1 {
  const record = objectAt(value, "snapshot", [
    "version",
    "route",
    "runtimeIdentity",
    "schemaDigest",
    "models",
  ]);
  if (record.version !== 1) {
    throw new FilmContractError(
      "invalid",
      "snapshot.version",
      "Capability snapshots are version 1",
    );
  }
  if (record.route !== "kling") {
    throw new FilmContractError("invalid", "snapshot.route", "This snapshot contract is for Kling");
  }
  if (!Array.isArray(record.models) || record.models.length === 0 || record.models.length > 20) {
    throw new FilmContractError(
      "malformed",
      "snapshot.models",
      "A snapshot needs its account models",
    );
  }
  const models = record.models.map((item, index) => model(item, `snapshot.models.${index}`));
  const identities = new Set(models.map((item) => item.id));
  if (identities.size !== models.length) {
    throw new FilmContractError("invalid", "snapshot.models", "Model ids must be unique");
  }
  return {
    version: 1,
    route: "kling",
    runtimeIdentity: readString(record, "snapshot", "runtimeIdentity", {
      required: true,
      max: 200,
    }),
    schemaDigest: readHash(record, "snapshot", "schemaDigest"),
    models,
  };
}

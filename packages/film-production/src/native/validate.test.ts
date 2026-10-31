import { describe, expect, test } from "vitest";
import type {
  CapabilitySnapshotV1,
  CompileContextV1,
  FilmReleaseProfileV1,
  NativeArgumentV1,
  NativeCandidateV1,
  VerifiedReferenceV1,
} from "../model.js";
import { TABLE_BETWEEN_CENTURIES_KLING_PROFILE } from "./releaseProfile.js";
import { canonicalJson, serializeCanonicalArgs, sha256Hex } from "./serialize.js";
import { validateNativeCandidate } from "./validate.js";

const HASH = "a".repeat(64);
const ALT_HASH = "b".repeat(64);
const DIGEST = "c".repeat(64);
const OPEN_PROFILE: FilmReleaseProfileV1 = { id: "open-fixture", restrictions: [] };

function acceptedCandidate(): NativeCandidateV1 {
  return {
    route: "kling",
    model: "account-model",
    args: [
      { name: "durationFrames", value: 96, source: "scene" },
      { name: "ratio", value: "16:9", source: "scene" },
      { name: "resolution", value: "1920x1080", source: "scene" },
      { name: "count", value: 1, source: "scene" },
      { name: "soundStrategy", value: "separate-edit", source: "scene" },
      { name: "patternId", value: "restrained-dialogue", source: "scene" },
      { name: "cameraPath", value: "Locked", source: "scene" },
    ],
    referenceSlots: [{ slot: "identity", referenceId: "ref-ada", sha256: HASH, role: "identity" }],
    schemaDigest: DIGEST,
    executable: false,
  };
}

function baseSnapshot(): CapabilitySnapshotV1 {
  return {
    version: 1,
    route: "kling",
    runtimeIdentity: "account-fixture",
    schemaDigest: DIGEST,
    models: [
      {
        id: "account-model",
        durationFrames: [96],
        ratios: ["16:9"],
        resolutions: [{ width: 1920, height: 1080 }],
        counts: [1],
        enums: {},
        slots: [{ name: "identity", mediaKinds: ["image"], required: true }],
        maxReferences: 4,
        unsupportedCombinations: [],
      },
    ],
  };
}

function verifiedIdentity(): VerifiedReferenceV1 {
  return { referenceId: "ref-ada", sha256: HASH, mediaKind: "image", role: "identity" };
}

function verifiedWardrobe(): VerifiedReferenceV1 {
  return { referenceId: "ref-coat", sha256: ALT_HASH, mediaKind: "image", role: "wardrobe" };
}

function context(
  snapshot: CapabilitySnapshotV1,
  profile: FilmReleaseProfileV1 = TABLE_BETWEEN_CENTURIES_KLING_PROFILE,
  verified: VerifiedReferenceV1[] = [verifiedIdentity()],
): CompileContextV1 {
  return {
    verifiedReferences: verified,
    sourceRevisionId: "source-1",
    reviewRevision: 4,
    knownVoices: ["voice-ada"],
    snapshot,
    profile,
  };
}

function requireModel(snapshot: CapabilitySnapshotV1) {
  const model = snapshot.models[0];
  if (!model) throw new Error("snapshot model");
  return model;
}

function codes(diagnostics: { code: string }[]): string[] {
  return diagnostics.map((item) => item.code);
}

function withArg(
  candidate: NativeCandidateV1,
  name: string,
  value: string | number,
): NativeCandidateV1 {
  return {
    ...candidate,
    args: candidate.args.map((arg) => (arg.name === name ? { ...arg, value } : arg)),
  };
}

function withExtra(candidate: NativeCandidateV1, arg: NativeArgumentV1): NativeCandidateV1 {
  return { ...candidate, args: [...candidate.args, arg] };
}

describe("serializeCanonicalArgs", () => {
  test("sorts object keys without whitespace and matches the producer sha256", () => {
    const value = { z: 1, a: { d: 1, b: 2 } };
    expect(canonicalJson(value)).toBe('{"a":{"b":2,"d":1},"z":1}');
    expect(sha256Hex(canonicalJson(value))).toBe(
      "b144bdeb6c9275466906a72892178e4a119af1f220d12867387fc2ad48ce465d",
    );
    expect(canonicalJson({ line: "Já chega — fica." })).toBe('{"line":"Já chega — fica."}');
    const reordered = serializeCanonicalArgs([{ source: "scene", value: "16:9", name: "ratio" }]);
    expect(reordered).toBe(
      serializeCanonicalArgs([{ name: "ratio", source: "scene", value: "16:9" }]),
    );
    expect(reordered).toBe('[{"name":"ratio","source":"scene","value":"16:9"}]');
  });
});

describe("validateNativeCandidate", () => {
  test("accepts a snapshot that agrees with every output, slot, and profile", () => {
    const snapshot = baseSnapshot();
    const result = validateNativeCandidate(acceptedCandidate(), snapshot, context(snapshot));
    expect(result.executable).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.canonicalArgs).toBe(serializeCanonicalArgs(acceptedCandidate().args));
    expect(result.canonicalSha256).toBe(sha256Hex(result.canonicalArgs));
  });

  test("describes the film profile without listing Kling models", () => {
    const encoded = JSON.stringify(TABLE_BETWEEN_CENTURIES_KLING_PROFILE);
    expect(encoded).toContain("Omni");
    expect(encoded).toContain("multishot");
    expect(encoded).toMatch(/native sound/i);
    expect(encoded).not.toContain("kling-v");
    expect(TABLE_BETWEEN_CENTURIES_KLING_PROFILE.id).toBe("table-between-centuries");
  });

  test("blocks executable release on a profile error", () => {
    const snapshot = baseSnapshot();
    const result = validateNativeCandidate(
      withArg(acceptedCandidate(), "soundStrategy", "native"),
      snapshot,
      context(snapshot),
    );
    expect(result.executable).toBe(false);
    expect(codes(result.diagnostics)).toEqual(["native-sound-limited"]);
  });

  test("reports duration, ratio, resolution, and count the model does not list", () => {
    const snapshot = baseSnapshot();
    const model = requireModel(snapshot);
    model.durationFrames = [24];
    model.ratios = ["1:1"];
    model.resolutions = [{ width: 1280, height: 720 }];
    model.counts = [2];
    const result = validateNativeCandidate(acceptedCandidate(), snapshot, context(snapshot));
    expect(result.executable).toBe(false);
    expect(codes(result.diagnostics)).toEqual([
      "duration-mismatch",
      "ratio-mismatch",
      "resolution-mismatch",
      "count-mismatch",
    ]);
  });

  test("reports a combined reference count above the model cap", () => {
    const snapshot = baseSnapshot();
    const model = requireModel(snapshot);
    model.maxReferences = 1;
    model.slots = [
      { name: "identity", mediaKinds: ["image"], required: true },
      { name: "wardrobe", mediaKinds: ["image"], required: false },
    ];
    const candidate = acceptedCandidate();
    candidate.referenceSlots = [
      { slot: "identity", referenceId: "ref-ada", sha256: HASH, role: "identity" },
      { slot: "wardrobe", referenceId: "ref-coat", sha256: ALT_HASH, role: "wardrobe" },
    ];
    const result = validateNativeCandidate(
      candidate,
      snapshot,
      context(snapshot, OPEN_PROFILE, [verifiedIdentity(), verifiedWardrobe()]),
    );
    expect(result.executable).toBe(false);
    expect(codes(result.diagnostics)).toEqual(["reference-cap"]);
    expect(result.diagnostics.some((item) => item.message.includes("Combined"))).toBe(true);
  });

  test("reports two references that alias to one snapshot slot", () => {
    const snapshot = baseSnapshot();
    const model = requireModel(snapshot);
    model.slots = [{ name: "start_frame", mediaKinds: ["image"], required: true }];
    const candidate = acceptedCandidate();
    candidate.referenceSlots = [
      { slot: "start-frame", referenceId: "ref-a", sha256: HASH, role: "start-frame" },
      { slot: "start_frame", referenceId: "ref-b", sha256: ALT_HASH, role: "start-frame" },
    ];
    const verified: VerifiedReferenceV1[] = [
      { referenceId: "ref-a", sha256: HASH, mediaKind: "image", role: "start-frame" },
      { referenceId: "ref-b", sha256: ALT_HASH, mediaKind: "image", role: "start-frame" },
    ];
    const result = validateNativeCandidate(
      candidate,
      snapshot,
      context(snapshot, OPEN_PROFILE, verified),
    );
    expect(result.executable).toBe(false);
    expect(codes(result.diagnostics)).toEqual(["slot-alias-collision"]);
  });

  test("reports an empty model list without throwing", () => {
    const current = baseSnapshot();
    const empty = baseSnapshot();
    empty.models = [];
    const run = () => validateNativeCandidate(acceptedCandidate(), empty, context(current));
    expect(run).not.toThrow();
    const result = run();
    expect(result.executable).toBe(false);
    expect(codes(result.diagnostics)).toEqual(["incomplete-snapshot"]);
  });

  test("reports schema drift against the snapshot argument", () => {
    const current = baseSnapshot();
    const drifted = baseSnapshot();
    drifted.schemaDigest = "d".repeat(64);
    const result = validateNativeCandidate(acceptedCandidate(), drifted, context(current));
    expect(result.executable).toBe(false);
    expect(codes(result.diagnostics)).toEqual(["schema-drift"]);
  });

  test("rejects an enum value the snapshot does not list", () => {
    const snapshot = baseSnapshot();
    requireModel(snapshot).enums = { movement: ["still"] };
    const candidate = withExtra(acceptedCandidate(), {
      name: "movement",
      value: "orbit",
      source: "snapshot-enum",
    });
    const result = validateNativeCandidate(candidate, snapshot, context(snapshot));
    expect(result.executable).toBe(false);
    expect(codes(result.diagnostics)).toEqual(["enum-mismatch"]);
  });

  test("rejects an argument the snapshot does not accept", () => {
    const snapshot = baseSnapshot();
    const candidate = withExtra(acceptedCandidate(), {
      name: "movement",
      value: "orbit",
      source: "snapshot-enum",
    });
    const result = validateNativeCandidate(candidate, snapshot, context(snapshot));
    expect(result.executable).toBe(false);
    expect(codes(result.diagnostics)).toEqual(["unaccepted-arg"]);
  });
});

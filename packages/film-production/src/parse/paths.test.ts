import { describe, expect, test } from "vitest";
import { parseAssistantContext, parseCandidate, parseReceipt } from "../contracts.js";

const pathParsers = [
  {
    name: "assistant compositionPath",
    fieldPath: "assistantContext.compositionPath",
    nullable: true,
    parse: (compositionPath: unknown) =>
      parseAssistantContext({
        projectId: "table",
        shotKey: "plan:S1",
        compositionPath,
        selectionId: null,
        playheadFrame: null,
        projectRevision: 0,
        sourceRevisionId: "source1",
        reviewRevision: 0,
      }).compositionPath,
  },
  {
    name: "receipt evidencePath",
    fieldPath: "receipt.evidencePath",
    nullable: true,
    parse: (evidencePath: unknown) =>
      parseReceipt(
        {
          id: "receipt1",
          attemptId: "attempt1",
          route: "kling",
          status: "unknown",
          nativeTaskId: null,
          traceId: null,
          outputSha256: null,
          evidencePath,
        },
        "receipt",
      ).evidencePath,
  },
  {
    name: "candidate mediaPath",
    fieldPath: "candidate.mediaPath",
    nullable: false,
    parse: (mediaPath: unknown) =>
      parseCandidate(
        {
          id: "take1",
          projectId: "table",
          shotKey: "plan:S1",
          attemptId: null,
          jobId: null,
          kind: "video",
          sha256: "b".repeat(64),
          mediaPath,
          width: 1920,
          height: 1080,
          fps: 24,
          durationFrames: 96,
          imageMetadata: null,
          firstFrameSha256: null,
          selected: false,
          accepted: false,
          provenance: { route: "owned-media", receiptId: null, originalOutputId: "" },
        },
        "candidate",
      ).mediaPath,
  },
];

const invalidPaths = [
  ["POSIX absolute", "/tmp/take.mp4"],
  ["Windows drive absolute", "C:/takes/take.mp4"],
  ["Windows drive relative", "C:take.mp4"],
  ["UNC", "\\\\server\\share\\take.mp4"],
  ["slash UNC", "//server/share/take.mp4"],
  ["backslash", "takes\\take.mp4"],
  ["colon", "takes/take:stream.mp4"],
  ["parent traversal", "../take.mp4"],
  ["nested parent traversal", "takes/../take.mp4"],
  ["parent segment only", ".."],
  ["dot segment", "takes/./take.mp4"],
  ["leading dot segment", "./take.mp4"],
  ["dot segment only", "."],
  ["empty segment", "takes//take.mp4"],
  ["trailing empty segment", "takes/"],
  ["NUL", "takes/take\0.mp4"],
  ["empty string", ""],
  ["over length limit", "a".repeat(4097)],
  ["missing value", undefined],
  ["number", 42],
] as const;

for (const parser of pathParsers) {
  describe(parser.name, () => {
    test.each([
      "scenes/sequence-1/index.html",
      "evidence/ação/take 01.json",
      "takes/take..v2/file.mp4",
      " assets / take.mp4 ",
      "a".repeat(4096),
    ])("preserves a valid relative path byte-for-byte (%#)", (path) => {
      expect(parser.parse(path)).toBe(path);
    });

    test.each(invalidPaths)("rejects %s", (_label, path) => {
      expect(() => parser.parse(path)).toThrowError(
        expect.objectContaining({ code: "invalid", fieldPath: parser.fieldPath }),
      );
    });

    test(parser.nullable ? "preserves null" : "rejects null", () => {
      if (parser.nullable) {
        expect(parser.parse(null)).toBeNull();
      } else {
        expect(() => parser.parse(null)).toThrowError(
          expect.objectContaining({ code: "invalid", fieldPath: parser.fieldPath }),
        );
      }
    });
  });
}

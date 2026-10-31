import { accessSync, constants, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  SCENE_AUTHORING_INSTRUCTIONS,
  type AssistantContextV1,
  type AssistantReadinessV1,
} from "@hyperframes/film-production/contracts";

/**
 * External authoring writes one handoff file and never starts Claude.
 * A proposal exists only when the caller supplies a response file.
 * This mode does not represent a Claude.ai login or API billing.
 */

const EXTERNAL_HANDOFF_EVIDENCE = "File handoff is available for an external authoring session.";

export interface ExternalHandoffDocument {
  version: 1;
  context: AssistantContextV1;
  instruction: string;
  authoringInstructions: string;
}

export function inspectExternalHandoff(directory: string): AssistantReadinessV1 {
  if (!handoffDirectoryReady(directory)) {
    return {
      provider: "claude-external",
      state: "unavailable",
      evidence: "File handoff needs a writable directory.",
    };
  }
  return {
    provider: "claude-external",
    state: "external-handoff",
    evidence: EXTERNAL_HANDOFF_EVIDENCE,
  };
}

export function writeExternalHandoff(
  directory: string,
  turnId: string,
  context: AssistantContextV1,
  instruction: string,
): { path: string; document: ExternalHandoffDocument } {
  const path = handoffFile(directory, turnId);
  const document: ExternalHandoffDocument = {
    version: 1,
    context,
    instruction,
    authoringInstructions: SCENE_AUTHORING_INSTRUCTIONS,
  };
  writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
  return { path, document };
}

function handoffDirectoryReady(directory: string): boolean {
  try {
    if (!statSync(directory).isDirectory()) return false;
    accessSync(directory, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function handoffFile(directory: string, turnId: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/.test(turnId)) {
    throw new Error("Assistant turn id is not producer-safe.");
  }
  return join(directory, `${turnId}-handoff.json`);
}

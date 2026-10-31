import { createHash } from "node:crypto";
import type { NativeArgumentV1 } from "../model.js";

/**
 * Canonical JSON matches the producer fingerprint: sorted keys, no whitespace.
 * sha256 is the hex digest of those UTF-8 bytes.
 */

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function serializeCanonicalArgs(args: readonly NativeArgumentV1[]): string {
  return canonicalJson(args);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (!isPlainObject(value)) return value;
  return sortedObject(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortedObject(value: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) sorted[key] = canonicalize(value[key]);
  return sorted;
}

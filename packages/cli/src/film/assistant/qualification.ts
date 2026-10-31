import type { AssistantRunResult } from "./codex.js";

export interface Qualification {
  ok: boolean;
  reasons: string[];
}

const API_KEY_NAME = /api[_-]?key/i;

/**
 * An API key in the environment would bill a different account.
 * Stripping it and continuing would be reduced protection, so the host hands off.
 */
export function qualifyEnvironment(
  env: Readonly<Record<string, string | undefined>>,
): Qualification {
  const names = Object.keys(env).filter((name) => apiKeyEntry(name, env[name]));
  if (names.length === 0) return { ok: true, reasons: [] };
  return { ok: false, reasons: [`Environment API key override: ${names.join(", ")}`] };
}

export function qualifyRunner(result: AssistantRunResult): Qualification {
  const reasons = [
    result.apiKeyInEnv ? "Environment API key override reported by the process runner." : "",
    result.unapprovedToolRequest ? "Unapproved tool request." : "",
    result.inheritedMcp ? "Inherited MCP configuration." : "",
  ].filter((reason) => reason.length > 0);
  return { ok: reasons.length === 0, reasons };
}

/** Child environment for a proposal run. Secret-bearing variables are never copied. */
export function isolatedProcessEnv(
  ambient: Readonly<Record<string, string | undefined>>,
  tempDir: string,
): Record<string, string> {
  const env: Record<string, string> = {
    CODEX_HOME: tempDir,
    HOME: tempDir,
    TMPDIR: tempDir,
  };
  const path = ambient.PATH;
  if (path) env.PATH = path;
  return env;
}

function apiKeyEntry(name: string, value: string | undefined): boolean {
  return Boolean(value) && API_KEY_NAME.test(name);
}

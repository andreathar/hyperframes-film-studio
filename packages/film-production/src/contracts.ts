/**
 * Public film contracts. Safe for the Studio browser and for Node.
 * The audited filesystem services stay on the server-only `./legacy` export.
 */
export * from "./model.js";
export {
  FilmContractError,
  parseAssistantContext,
  parseAttempt,
  parseCandidate,
  parseCapabilitySnapshot,
  parseFilmCommand,
  parseReceipt,
  parseSceneBrief,
  parseSourceRevision,
} from "./parse/index.js";

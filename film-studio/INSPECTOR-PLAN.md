# Production inspector implementation

Accepted continuation: provide a visible local companion inspector for the existing import/review workflow. It inherits Hyperframes DESIGN.md tokens; operate mode, searchable shot rail, source/direction detail and contextual assignment controls. No replacement editor or provider execution.

- CLI loads one explicit import and optional review file; loopback-only HTTP server, no arbitrary browser file paths. Initial data is empty-selection review or replayed existing state.
- Project-scoped display projection omits raw documents, absolute paths and credentials. Render source text with DOM textContent. Known-reference/take media preview requires explicit workspace root, confined current bytes matching the observed hash, bounded reads and safe MIME types.
- Commands carry expected revision and use existing applyReview. Same-origin JSON POST with session CSRF token; Host validation, no CORS, CSP and no-store. Session changes are in memory. Download review explicitly to retain them; do not write source files or silently overwrite saved review files.
- UI: search/source filter, shot counts, source notes, declared states, mapping/ref/take controls with required reason, inline errors and revision indicator, diagnostic list, explicit remove controls and download. Unavailable/archived/unmapped inputs show actionable states. At narrow widths retain stacked review tasks without horizontal page overflow.
- Tests first for HTTP projection/proposals, stale/foreign requests, media confinement/hash drift and actual UI events. Then bounded real-browser desktop/mobile checks and screenshots, keyboard/error/reload workflow. Lint/format/root script reachability, final independent review, commit/push the source to draft PR #1 and update Board.

Private media/snapshots remain ignored. This companion operates on supplied observations, not a live source database. It cannot authenticate artistic approval, load models, submit jobs or alter the composition. The existing media preview server remains untouched.

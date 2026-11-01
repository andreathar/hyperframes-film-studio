import { useCallback, useEffect, useMemo, useState } from "react";
import { TbcError, tbcClient, type TbcClient } from "./client";
import type {
  TbcApplyResult,
  TbcHealth,
  TbcIssue,
  TbcShotContextV1,
  TbcShotRow,
  TbcTurnV1,
} from "./types";

/** How often a running turn is polled for new events. */
const TURN_POLL_MS = 400;

type TbcConnection =
  | { kind: "probing" }
  | { kind: "offline"; reason: string }
  | { kind: "connected"; health: TbcHealth };

/** What the last Apply did, shown under the proposals until the next turn. */
export interface ApplyOutcome {
  index: number;
  ok: boolean;
  message: string;
  issues: readonly TbcIssue[];
}

export interface TbcProductionProps {
  manifest: string;
  shots: readonly TbcShotRow[];
  shotId: string | null;
  context: TbcShotContextV1 | null;
  error: string | null;
  onSelectShot: (id: string) => void;
  onReload: () => void;
  mediaUrl: (entity: string, view: string) => string;
}

export interface TbcAssistantProps {
  available: boolean;
  unavailableReason: string | null;
  contextLabel: string;
  hasContext: boolean;
  instruction: string;
  onInstructionChange: (next: string) => void;
  onSend: () => void;
  onCancel: () => void;
  turn: TbcTurnV1 | null;
  /** Why the turn's proposals are a read-only draft (another shot or revision), or null. */
  staleReason: string | null;
  applying: number | null;
  applied: readonly number[];
  outcome: ApplyOutcome | null;
  onApply: (index: number) => void;
  sendError: string | null;
}

export type TbcSession =
  | { kind: "probing" | "offline" }
  | { kind: "connected"; production: TbcProductionProps; assistant: TbcAssistantProps };

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * A turn answered for another shot, or before the shot changed, is shown but never applied: the
 * same rule as `useVisibleProposal` for film briefs, keyed on the shot's revision.
 */
export function staleReasonOf(
  turn: TbcTurnV1 | null,
  context: TbcShotContextV1 | null,
): string | null {
  if (turn === null) return null;
  if (context === null || turn.shotId !== context.shot.id) {
    return `This reply is for ${turn.shotId}; open that shot to apply it.`;
  }
  if (turn.revision !== context.revision) {
    return "The shot changed since this reply; send the instruction again.";
  }
  return null;
}

/** Probes `/api/health` once; offline keeps Studio on its disconnected film panels. */
function useConnection(client: TbcClient): TbcConnection {
  const [connection, setConnection] = useState<TbcConnection>({ kind: "probing" });
  useEffect(() => {
    let live = true;
    client.health().then(
      (health) => {
        if (live) setConnection({ kind: "connected", health });
      },
      (error: unknown) => {
        if (live) setConnection({ kind: "offline", reason: messageOf(error) });
      },
    );
    return () => {
      live = false;
    };
  }, [client]);
  return connection;
}

/** Polls a running turn, appending new events (`?after=<n>`) until it ends. */
function usePolledTurn(client: TbcClient) {
  const [turn, setTurn] = useState<TbcTurnV1 | null>(null);
  useEffect(() => {
    if (turn === null || turn.state !== "running") return;
    let live = true;
    const after = turn.events.length;
    const timer = setTimeout(() => {
      client.turn(turn.id, after).then(
        (next) => {
          if (!live) return;
          setTurn((prev) =>
            prev === null || prev.id !== next.id
              ? prev
              : { ...next, events: [...prev.events.slice(0, after), ...next.events] },
          );
        },
        (error: unknown) => {
          if (!live) return;
          setTurn((prev) =>
            prev === null || prev.id !== turn.id
              ? prev
              : { ...prev, state: "error", error: messageOf(error) },
          );
        },
      );
    }, TURN_POLL_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [client, turn]);
  return [turn, setTurn] as const;
}

/** The shot list and the context of the picked shot; `reload` refetches both. */
function useShotData(client: TbcClient, connected: boolean) {
  const [shots, setShots] = useState<readonly TbcShotRow[]>([]);
  const [shotId, setShotId] = useState<string | null>(null);
  const [context, setContext] = useState<TbcShotContextV1 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    if (!connected) return;
    let live = true;
    client.shots().then(
      (rows) => {
        if (!live) return;
        setShots(rows);
        setShotId((current) => current ?? rows[0]?.id ?? null);
      },
      (failure: unknown) => {
        if (live) setError(messageOf(failure));
      },
    );
    return () => {
      live = false;
    };
  }, [client, connected, reloads]);

  useEffect(() => {
    if (!connected || shotId === null) return;
    let live = true;
    client.context(shotId).then(
      (next) => {
        if (!live) return;
        setContext(next);
        setError(null);
      },
      (failure: unknown) => {
        if (!live) return;
        setContext(null);
        setError(messageOf(failure));
      },
    );
    return () => {
      live = false;
    };
  }, [client, connected, shotId, reloads]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);
  const selectShot = useCallback((id: string) => setShotId(id), []);
  return { shots, shotId, context, setContext, error, reload, selectShot };
}

function appliedMessage(result: TbcApplyResult): string {
  return result.applied.kind === "preset-edited"
    ? `Rewrote ${result.applied.field} in ${result.applied.file}.`
    : `Drafted ${result.applied.files.length} look file(s); review them, then lock with tbc looks lock.`;
}

/** Applies one proposal at a time at the shown revision; 409 (stale) reloads the shot. */
function useApply(
  client: TbcClient,
  context: TbcShotContextV1 | null,
  onContext: (next: TbcShotContextV1) => void,
  reload: () => void,
) {
  const [applying, setApplying] = useState<number | null>(null);
  const [applied, setApplied] = useState<readonly number[]>([]);
  const [outcome, setOutcome] = useState<ApplyOutcome | null>(null);

  const apply = useCallback(
    (turnId: string, index: number) => {
      if (context === null || applying !== null) return;
      setApplying(index);
      client.apply(turnId, index, context.revision).then(
        (result) => {
          setApplying(null);
          setApplied((done) => [...done, index]);
          setOutcome({ index, ok: true, message: appliedMessage(result), issues: [] });
          if (result.context !== null) onContext(result.context);
          reload();
        },
        (failure: unknown) => {
          setApplying(null);
          const issues = failure instanceof TbcError ? failure.issues : [];
          setOutcome({ index, ok: false, message: messageOf(failure), issues });
          if (failure instanceof TbcError && failure.status === 409) reload();
        },
      );
    },
    [applying, client, context, onContext, reload],
  );

  const reset = useCallback(() => {
    setOutcome(null);
    setApplied([]);
  }, []);
  return { applying, applied, outcome, apply, reset };
}

/** The instruction, the polled turn, Send and Cancel; a new turn clears the last apply. */
function useTurn(
  client: TbcClient,
  context: TbcShotContextV1 | null,
  reload: () => void,
  onNewTurn: () => void,
) {
  const [instruction, setInstruction] = useState("");
  const [turn, setTurn] = usePolledTurn(client);
  const [sendError, setSendError] = useState<string | null>(null);

  const send = useCallback(() => {
    if (context === null) return;
    const text = instruction.trim();
    if (text === "") return;
    setSendError(null);
    onNewTurn();
    // The turn is frozen to the revision on screen; tbc serve refuses it (409) if that is stale.
    client
      .startTurn({ shotId: context.shot.id, instruction: text, revision: context.revision })
      .then(
        (started) => setTurn(started),
        (failure: unknown) => {
          setSendError(messageOf(failure));
          if (failure instanceof TbcError && failure.status === 409) reload();
        },
      );
  }, [client, context, instruction, onNewTurn, reload, setTurn]);

  const cancel = useCallback(() => {
    if (turn === null || turn.state !== "running") {
      setInstruction("");
      return;
    }
    client.cancel(turn.id).then(
      (snapshot) => setTurn(snapshot),
      (failure: unknown) => setSendError(messageOf(failure)),
    );
  }, [client, turn, setTurn]);

  return { instruction, setInstruction, turn, sendError, send, cancel };
}

function contextLabelOf(manifest: string, context: TbcShotContextV1 | null): string {
  return context === null
    ? `${manifest} · no shot`
    : `${manifest} · ${context.shot.id} · revision ${context.revision.slice(0, 8)}`;
}

export function useTbcSession(given?: TbcClient): TbcSession {
  const [client] = useState(() => given ?? tbcClient());
  const connection = useConnection(client);
  const data = useShotData(client, connection.kind === "connected");
  const { shots, shotId, context, setContext, error, reload, selectShot } = data;
  const { applying, applied, outcome, apply, reset } = useApply(
    client,
    context,
    setContext,
    reload,
  );
  const { instruction, setInstruction, turn, sendError, send, cancel } = useTurn(
    client,
    context,
    reload,
    reset,
  );
  const applyToTurn = useCallback(
    (index: number) => {
      if (turn !== null) apply(turn.id, index);
    },
    [apply, turn],
  );

  const health = connection.kind === "connected" ? connection.health : null;
  const production = useMemo<TbcProductionProps | null>(
    () =>
      health === null
        ? null
        : {
            manifest: health.manifest,
            shots,
            shotId,
            context,
            error,
            onSelectShot: selectShot,
            onReload: reload,
            mediaUrl: client.lookMediaUrl,
          },
    [client, context, error, health, reload, selectShot, shotId, shots],
  );

  const assistant = useMemo<TbcAssistantProps | null>(
    () =>
      health === null
        ? null
        : {
            available: health.assistant.available,
            unavailableReason: health.assistant.available
              ? null
              : (health.assistant.reason ?? null),
            contextLabel: contextLabelOf(health.manifest, context),
            hasContext: context !== null,
            instruction,
            onInstructionChange: setInstruction,
            onSend: send,
            onCancel: cancel,
            turn,
            staleReason: staleReasonOf(turn, context),
            applying,
            applied,
            outcome,
            onApply: applyToTurn,
            sendError,
          },
    [
      applied,
      applyToTurn,
      applying,
      cancel,
      context,
      health,
      instruction,
      outcome,
      send,
      sendError,
      setInstruction,
      turn,
    ],
  );

  if (production === null || assistant === null) {
    return { kind: connection.kind === "connected" ? "probing" : connection.kind };
  }
  return { kind: "connected", production, assistant };
}

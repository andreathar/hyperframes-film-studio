import { useCallback, useState } from "react";
import { SCENE_AUTHORING_INSTRUCTIONS } from "@hyperframes/film-production/browser";
import { copyTextToClipboard } from "../utils/clipboard";
import {
  DISCONNECTED_SHOT_KEY,
  type AssistantPanelProps,
  type AssistantReadinessView,
  type ProductionPanelProps,
  type ProductionShot,
} from "./types";

const DISCONNECTED_SHOT: ProductionShot = {
  shotKey: DISCONNECTED_SHOT_KEY,
  title: "No shot connected",
  direction: {
    camera: "",
    acting: "",
    dialogue: "",
    lighting: "",
    continuity: "",
  },
  lineIds: [],
  references: [],
};

const READINESS: AssistantReadinessView = {
  provider: "claude-external",
  state: "unavailable",
  evidence: "This Studio session has no film assistant host. Copy handoff keeps the instruction.",
};

const noop = () => {};

const NEXT_BLOCKED = "Needs a film project. Connecting one arrives with the film host.";

export function useFilmSession(showToast: (message: string, tone?: "error" | "info") => void): {
  production: ProductionPanelProps;
  assistant: AssistantPanelProps;
} {
  const [instruction, setInstruction] = useState("");
  const onNextStep = useCallback(() => showToast(NEXT_BLOCKED, "info"), [showToast]);
  const onCancel = useCallback(() => setInstruction(""), []);
  const onCopyHandoff = useCallback(() => {
    void copyHandoff(instruction, showToast);
  }, [instruction, showToast]);
  return {
    production: {
      shot: DISCONNECTED_SHOT,
      brief: null,
      compilation: null,
      snapshot: null,
      onBriefChange: noop,
      onApplyProposal: noop,
      onPrepare: noop,
      onNextStep,
    },
    assistant: {
      contextLabel: "No film project · no shot · revision unavailable",
      readiness: READINESS,
      proposal: null,
      shotDialogue: "",
      draftInstruction: instruction,
      onInstructionChange: setInstruction,
      onSend: noop,
      onApply: noop,
      onCancel,
      onCopyHandoff,
    },
  };
}

async function copyHandoff(
  instruction: string,
  showToast: (message: string, tone?: "error" | "info") => void,
) {
  const text = [SCENE_AUTHORING_INSTRUCTIONS, "Instruction:", instruction]
    .filter(Boolean)
    .join("\n");
  const copied = await copyTextToClipboard(text);
  const tone = copied ? "info" : "error";
  showToast(copied ? "Copied the scene handoff." : "Could not copy the scene handoff.", tone);
}

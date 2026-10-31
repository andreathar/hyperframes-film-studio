import { useState } from "react";
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

const PREPARE_BLOCKED = "Prepare stays blocked until this project is connected to the film ledger.";
const NEXT_BLOCKED = "Needs a film project. Connecting one arrives with the film host.";
const SEND_BLOCKED =
  "Send stays blocked until an assistant host is connected. Copy handoff is available.";

export function useFilmSession(showToast: (message: string, tone?: "error" | "info") => void): {
  production: ProductionPanelProps;
  assistant: AssistantPanelProps;
} {
  const [instruction, setInstruction] = useState("");
  return {
    production: {
      shot: DISCONNECTED_SHOT,
      brief: null,
      compilation: null,
      snapshot: null,
      onBriefChange: () => {},
      onApplyProposal: () => {},
      onPrepare: () => showToast(PREPARE_BLOCKED, "info"),
      onNextStep: () => showToast(NEXT_BLOCKED, "info"),
    },
    assistant: {
      contextLabel: "No film project · no shot · revision unavailable",
      readiness: READINESS,
      proposal: null,
      shotDialogue: "",
      draftInstruction: instruction,
      onInstructionChange: setInstruction,
      onSend: () => showToast(SEND_BLOCKED, "info"),
      onApply: () => {},
      onCancel: () => setInstruction(""),
      onCopyHandoff: () => {
        void copyHandoff(instruction, showToast);
      },
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

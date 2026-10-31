import type {
  CapabilitySnapshotV1,
  CompilationV1,
  SceneBriefV1,
} from "@hyperframes/film-production/browser";

/** The selected shot, as the parent resolved it. Dialogue is the exact line. */
export interface ProductionShot {
  shotKey: string;
  title: string;
  direction: {
    camera: string;
    acting: string;
    dialogue: string;
    lighting: string;
    continuity: string;
  };
  lineIds: string[];
  references: Array<{
    id: string;
    role: string;
    sha256: string;
    mediaKind: string;
  }>;
}

export interface ProductionPanelProps {
  shot: ProductionShot;
  brief: SceneBriefV1 | null;
  compilation: CompilationV1 | null;
  snapshot: CapabilitySnapshotV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
  onApplyProposal: (brief: SceneBriefV1) => void;
  onPrepare: () => void;
}

/** Provider status as the host reported it. The panel does not invent a ready state. */
export interface AssistantReadinessView {
  state: string;
  evidence: string;
}

export interface AssistantPanelProps {
  contextLabel: string;
  readiness: AssistantReadinessView;
  proposal: SceneBriefV1 | null;
  /** Exact dialogue on the current shot, shown beside the proposal line. */
  shotDialogue?: string;
  draftInstruction: string;
  onInstructionChange: (text: string) => void;
  onSend: () => void;
  onApply: () => void;
  onCancel: () => void;
  onCopyHandoff: () => void;
}

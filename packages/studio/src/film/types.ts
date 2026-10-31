import type { StepId } from "./steps";
import type {
  AssistantReadinessV1,
  CapabilitySnapshotV1,
  CompilationV1,
  ProjectShotViewV1,
  ReferenceRole,
  SceneBriefV1,
  SceneReferenceBindingV1,
} from "@hyperframes/film-production/browser";

export interface ShotReference {
  id: string;
  role: ReferenceRole;
  sha256: string;
  mediaKind: SceneReferenceBindingV1["mediaKind"];
}

/** The selected shot, as the parent resolved it. Dialogue is the exact line. */
export interface ProductionShot extends Omit<
  ProjectShotViewV1,
  "referenceIds" | "selectedCandidateId"
> {
  references: ShotReference[];
}

/** The placeholder shotKey while no film project is connected. */
export const DISCONNECTED_SHOT_KEY = "unconnected";

export interface ProductionPanelProps {
  shot: ProductionShot;
  brief: SceneBriefV1 | null;
  compilation: CompilationV1 | null;
  snapshot: CapabilitySnapshotV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
  onApplyProposal: (brief: SceneBriefV1) => void;
  onPrepare: () => void;
  /** Takes made for this shot. Absent until the film host reports them. */
  takes?: number;
  /** Whether a take is already on the timeline. */
  placed?: boolean;
  /** The Next card's one action. */
  onNextStep?: (step: StepId) => void;
}

/** Provider status as the host reported it. The panel does not invent a ready state. */
export type AssistantReadinessView = AssistantReadinessV1;

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

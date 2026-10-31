import type {
  AssistantReadinessStateV1,
  PromptSectionId,
  ReferenceRole,
  SoundStrategyV1,
} from "@hyperframes/film-production/browser";

export interface Term {
  label: string;
  hint: string;
}

export const REFERENCE_ROLE_TERMS: Record<ReferenceRole, Term> = {
  identity: {
    label: "Who it is",
    hint: "Locks the face and body Kling keeps across the shot.",
  },
  wardrobe: {
    label: "What they wear",
    hint: "Keeps the clothes and accessories the same as in this picture.",
  },
  prop: {
    label: "Object in the scene",
    hint: "Keeps the shape and look of an object people hold or see.",
  },
  "start-frame": {
    label: "Opening frame",
    hint: "The image Kling starts from.",
  },
  "end-frame": {
    label: "Closing frame",
    hint: "The image Kling moves toward by the end of the shot.",
  },
  motion: {
    label: "How it moves",
    hint: "A clip whose movement Kling should copy.",
  },
  environment: {
    label: "The place",
    hint: "Shows the room or location so the setting stays the same.",
  },
  style: {
    label: "Look and mood",
    hint: "Sets the colour, light and feel without copying what is in the picture.",
  },
  exclusion: {
    label: "Keep out",
    hint: "Something that must not appear.",
  },
};

export const SOUND_STRATEGY_TERMS: Record<SoundStrategyV1, Term> = {
  native: {
    label: "Sound made with the video",
    hint: "The video model creates the voices and sounds along with the picture.",
  },
  "separate-edit": {
    label: "Add sound in the edit",
    hint: "The shot is made silent and you add voices and sounds later on the timeline.",
  },
  silence: {
    label: "No sound",
    hint: "This shot stays silent on purpose.",
  },
  unsupported: {
    label: "Sound not available",
    hint: "The chosen model cannot make sound for this shot, so it will be silent.",
  },
};

export const READINESS_TERMS: Record<AssistantReadinessStateV1, Term & { action: string | null }> =
  {
    "missing-cli": {
      label: "Codex isn't installed",
      hint: "This computer has no Codex program, so the assistant cannot start.",
      action: "Install Codex, then reopen",
    },
    unauthenticated: {
      label: "Not signed in",
      hint: "The assistant is installed but needs you to sign in to your account.",
      action: "Sign in, then try again",
    },
    "unsupported-protocol": {
      label: "This version is too old or too new",
      hint: "The installed assistant does not speak the same language as Studio.",
      action: "Update the assistant, then reopen",
    },
    unavailable: {
      label: "Assistant not responding",
      hint: "The assistant did not answer. It may be busy or offline.",
      action: "Try again in a moment",
    },
    limited: {
      label: "Works with limits",
      hint: "The assistant can help, but some features are switched off.",
      action: null,
    },
    ready: {
      label: "Ready",
      hint: "The assistant is signed in and can suggest changes.",
      action: null,
    },
    "external-handoff": {
      label: "Claude works in your own session",
      hint: "Studio cannot talk to Claude directly. You pass the request to your own Claude window.",
      action: "Copy for Claude",
    },
  };

export const SECTION_TERMS: Record<PromptSectionId, Term> = {
  "reference-grounding": {
    label: "Pictures to follow",
    hint: "Which images Kling should match for people, objects and places.",
  },
  "opening-composition": {
    label: "How the shot opens",
    hint: "Where people and things stand in the frame at the first moment.",
  },
  "timed-action": {
    label: "What happens, and when",
    hint: "The steps of the action in order, with their timing.",
  },
  "camera-rhythm": {
    label: "Camera and pace",
    hint: "How the camera moves and how fast the shot feels.",
  },
  "environment-light": {
    label: "Place and light",
    hint: "The setting, the time of day and how it is lit.",
  },
  "dialogue-sound": {
    label: "Speech and sound",
    hint: "What is said and which sounds you hear.",
  },
  "continuity-exclusions": {
    label: "Keep consistent, keep out",
    hint: "What must stay the same from shot to shot, and what must never appear.",
  },
};

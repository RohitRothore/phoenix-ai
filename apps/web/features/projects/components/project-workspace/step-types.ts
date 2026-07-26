import type { Step } from "../ProjectWorkspace";

export interface BaseStepProps {
  projectSlug: string;
  loading: Record<Step, boolean>;
  error: string | null;
  setError: (error: string | null) => void;
}

export interface PipelineStageInfo {
  stage: string;
  status: "pending" | "queued" | "running" | "completed" | "failed" | "cancelled";
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  retryCount?: number;
  errorMessage?: string;
}

export interface DirectorStepProps extends BaseStepProps {
  plan: import("@/features/projects/services/project.service").DirectorPlan | null;
  onGenerateDirectorPlan: () => Promise<void>;
}

export interface StoryStepProps extends BaseStepProps {
  story: import("@/features/projects/services/project.service").Story | null;
  onGenerateStory: () => Promise<void>;
}

export interface ScenesStepProps extends BaseStepProps {
  scenes: import("@/features/projects/services/project.service").Scenes | null;
  onGenerateScenes: () => Promise<void>;
}

export interface DialoguesStepProps extends BaseStepProps {
  dialogues: import("@/features/projects/services/project.service").Dialogues | null;
  scenes: import("@/features/projects/services/project.service").Scenes | null;
  onGenerateDialogues: () => Promise<void>;
}

export interface PromptsStepProps extends BaseStepProps {
  prompts: import("@/features/projects/services/project.service").Prompts | null;
  scenes: import("@/features/projects/services/project.service").Scenes | null;
  imageResults: import("@/features/projects/services/project.service").ImageGenerationResult[] | null;
  assets: import("@/features/projects/services/project.service").Asset[] | null;
  onGeneratePrompts: () => Promise<void>;
  onGenerateImages: () => Promise<void>;
  onRegenerateImage: (sceneId: string) => Promise<void>;
  onRefreshPipeline: () => Promise<void>;
}

export interface ProduceStepProps extends BaseStepProps {
  scenes: import("@/features/projects/services/project.service").Scenes | null;
  prompts: import("@/features/projects/services/project.service").Prompts | null;
  imageResults: import("@/features/projects/services/project.service").ImageGenerationResult[] | null;
  renderResults: import("@/features/projects/services/project.service").SceneRenderResult[] | null;
  voiceResult: import("@/features/projects/services/project.service").VoiceGenerationResult | null;
  subtitles: import("@/features/projects/services/project.service").Subtitles | null;
  compositionResult: import("@/features/projects/services/project.service").CompositionResult | null;
  assets: import("@/features/projects/services/project.service").Asset[] | null;
  pipelineStages?: PipelineStageInfo[];
  onRenderProject: () => Promise<void>;
  onRenderScene: (sceneId: string) => Promise<void>;
  onGenerateVoice: () => Promise<void>;
  onGenerateSubtitles: () => Promise<void>;
  onComposeVideo: () => Promise<void>;
  onRefreshPipeline: () => Promise<void>;
}

// Re-export Step type for convenience
export type { Step };

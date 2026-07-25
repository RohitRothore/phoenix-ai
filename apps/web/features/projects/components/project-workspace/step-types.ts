import type { Step } from "../ProjectWorkspace";

export interface BaseStepProps {
  projectSlug: string;
  loading: Record<Step, boolean>;
  error: string | null;
  setError: (error: string | null) => void;
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
  onGeneratePrompts: () => Promise<void>;
}

export interface ImagesStepProps extends BaseStepProps {
  imageResults: import("@/features/projects/services/project.service").ImageGenerationResult[] | null;
  scenes: import("@/features/projects/services/project.service").Scenes | null;
  prompts: import("@/features/projects/services/project.service").Prompts | null;
  assets: import("@/features/projects/services/project.service").Asset[] | null;
  onGenerateImages: () => Promise<void>;
  onRegenerateImage: (sceneId: string) => Promise<void>;
  onRefreshPipeline: () => Promise<void>;
  onRenderScene: (sceneId: string) => Promise<void>;
}

export interface RenderStepProps extends BaseStepProps {
  renderResults: import("@/features/projects/services/project.service").SceneRenderResult[] | null;
  scenes: import("@/features/projects/services/project.service").Scenes | null;
  assets: import("@/features/projects/services/project.service").Asset[] | null;
  pipelineStatus: import("@/features/projects/services/project.service").PipelineStatus | null;
  imageResults: import("@/features/projects/services/project.service").ImageGenerationResult[] | null;
  onRenderProject: () => Promise<void>;
  onRefreshPipeline: () => Promise<void>;
  onRenderScene: (sceneId: string) => Promise<void>;
}

export interface VideoStepProps extends BaseStepProps {
  videoPlan: import("@/features/projects/services/project.service").VideoPlan | null;
  subtitles: import("@/features/projects/services/project.service").Subtitles | null;
  exportPath: string | null;
  onPrepareVideo: () => Promise<void>;
  onRenderVideo: () => Promise<void>;
  onGenerateSubtitles: () => Promise<void>;
  onExportVideo: () => Promise<void>;
}

// Re-export Step type for convenience
export type { Step };
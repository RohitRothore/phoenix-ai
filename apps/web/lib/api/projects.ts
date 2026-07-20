import { api, ApiResponse } from './client';
import type {
  Project,
  DirectorArtifact,
  StoryArtifact,
  SceneArtifact,
  DialogueArtifact,
  PromptArtifact,
  VideoArtifact,
  SubtitleArtifact,
  VoiceArtifact,
} from '@/lib/types/project';

export type CreateProjectInput = {
  name: string;
  language: string;
  platform: string;
  style: string;
  humor?: string;
};

export const projectsApi = {
  list: () => api.get<ApiResponse<Project[]>>('/projects'),

  create: (input: CreateProjectInput) =>
    api.post<ApiResponse<Project>>('/projects', input),

  findBySlug: (slug: string) =>
    api.get<ApiResponse<Project>>(`/projects/${slug}`),

  getDirectorPlan: (slug: string) =>
    api.get<ApiResponse<DirectorArtifact>>(`/projects/${slug}/director-plan`),

  getStory: (slug: string) =>
    api.get<ApiResponse<StoryArtifact>>(`/projects/${slug}/story`),

  getScenes: (slug: string) =>
    api.get<ApiResponse<SceneArtifact>>(`/projects/${slug}/scenes`),

  getDialogues: (slug: string) =>
    api.get<ApiResponse<DialogueArtifact>>(`/projects/${slug}/dialogues`),

  getPrompts: (slug: string) =>
    api.get<ApiResponse<PromptArtifact>>(`/projects/${slug}/prompts`),

  getVideoPlan: (slug: string) =>
    api.get<ApiResponse<VideoArtifact>>(`/projects/${slug}/video`),

  getSubtitles: (slug: string) =>
    api.get<ApiResponse<SubtitleArtifact>>(`/projects/${slug}/subtitles`),

  getVoice: (slug: string) =>
    api.get<ApiResponse<VoiceArtifact>>(`/projects/${slug}/voice`),

  generateDirectorPlan: (slug: string) =>
    api.post<ApiResponse<DirectorArtifact>>(
      `/projects/${slug}/director-plan`,
      {},
    ),

  generateStory: (slug: string) =>
    api.post<ApiResponse<StoryArtifact>>(`/projects/${slug}/story`, {}),

  generateScenes: (slug: string) =>
    api.post<ApiResponse<SceneArtifact>>(`/projects/${slug}/scenes`, {}),

  generateDialogues: (slug: string) =>
    api.post<ApiResponse<DialogueArtifact>>(`/projects/${slug}/dialogues`, {}),

  generatePrompts: (slug: string) =>
    api.post<ApiResponse<PromptArtifact>>(`/projects/${slug}/prompts`, {}),

  prepareVideo: (slug: string) =>
    api.post<ApiResponse<VideoArtifact>>(`/projects/${slug}/video`, {}),

  renderVideo: (slug: string) =>
    api.post<ApiResponse<VideoArtifact>>(`/projects/${slug}/video/render`, {}),

  generateSubtitles: (slug: string) =>
    api.post<ApiResponse<SubtitleArtifact>>(`/projects/${slug}/subtitles`, {}),

  generateVoice: (slug: string) =>
    api.post<ApiResponse<VoiceArtifact>>(`/projects/${slug}/voice`, {}),

  exportVideo: (slug: string) =>
    api.post<ApiResponse<{ path: string }>>(`/projects/${slug}/export`, {}),
};
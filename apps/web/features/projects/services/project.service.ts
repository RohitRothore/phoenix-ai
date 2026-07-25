// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  slug: string;
  name: string;
  language: string;
  platform: string;
  style: string;
  humor: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectorPlan {
  genre: string;
  targetAudience: string;
  tone: string;
  pacing: string;
  storyStructure: string[];
  visualStyle: string;
  comedyMechanics: string[];
  contentGuidelines: string;
  status: string;
  generatedAt: string;
}

export interface StoryAct {
  name: string;
  description: string;
}

export interface StoryCharacter {
  name: string;
  role: string;
  personality: string;
}

export interface Story {
  title: string;
  hook: string;
  premise: string;
  summary: string;
  acts: StoryAct[];
  comedyBeat: string;
  ending: string;
  characters: StoryCharacter[];
  status: string;
  generatedAt: string;
}

export interface SceneItem {
  id: number;
  title: string;
  act: string;
  duration: number;
  description: string;
  dialogue: string;
  visualPrompt: string;
  comedyElement: string;
}

export interface Scenes {
  scenes: SceneItem[];
  status: string;
  generatedAt: string;
}

export interface DialogueLine {
  character: string;
  text: string;
  emotion: string;
  timing: string;
}

export interface SceneDialogue {
  id: number;
  dialogue: DialogueLine[];
}

export interface Dialogues {
  scenes: SceneDialogue[];
  status: string;
  generatedAt: string;
}

export interface RenderPrompt {
  id: number;
  prompt: string;
  negativePrompt: string;
  camera: string;
  lighting: string;
  mood: string;
}

export interface Prompts {
  promptVersion: string;
  scenes: RenderPrompt[];
  status: string;
  generatedAt: string;
}

export interface VideoScene {
  id: number;
  scenePath: string;
  duration: number;
  prompt: string;
  negativePrompt: string;
  camera: string;
  lighting: string;
  mood: string;
  status: "pending" | "generating" | "ready" | "failed";
}

export interface VideoPlan {
  scenes: VideoScene[];
  status: string;
  resolution: "1080x1920";
  frameRate: 24 | 30;
  generatedAt: string;
  renderStatus?: "completed";
  finalPath?: string;
  renderedAt?: string;
}

export interface Subtitles {
  cues: Array<{ index: number; startTime: string; endTime: string; text: string }>;
  srtPath: string;
  status: string;
  generatedAt: string;
}

// ─── Image Generation Types ───────────────────────────────────────────────────

export interface ImageGenerationResult {
  sceneId: string;
  assetId: string;
  imageUrl: string;
  imagePath: string;
  provider: string;
  model: string;
  generationTime: number;
  width: number;
  height: number;
  seed?: number;
}

export interface Asset {
  sceneId: string;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "SUBTITLE" | "EXPORT";
  filename: string;
  path: string;
  url?: string;
  width?: number;
  height?: number;
  duration?: number;
  provider?: string;
  model?: string;
  generationTime?: number;
  seed?: number;
  status: "pending" | "generating" | "ready" | "failed" | "cancelled";
}

export interface SceneRenderResult {
  sceneId: string;
  videoPath: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
}

export interface PipelineStageInfo {
  stage: string;
  status: "pending" | "queued" | "running" | "completed" | "failed" | "cancelled";
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  retryCount?: number;
  errorMessage?: string;
  logs?: Array<{ timestamp: string; level: string; message: string }>;
}

export interface PipelineJobInfo {
  sceneId: string;
  type: string;
  provider: string;
  status: "pending" | "queued" | "running" | "completed" | "failed" | "cancelled";
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  retryCount?: number;
  errorMessage?: string;
  logs?: Array<{ timestamp: string; level: string; message: string }>;
}

export interface PipelineStatus {
  projectId: string;
  projectName: string;
  stages: PipelineStageInfo[];
  jobs: PipelineJobInfo[];
  assets: Asset[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── HTTP Client ─────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: `Request failed: ${response.status}` }));
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? (payload as { message?: string }).message
      : undefined;
    throw new Error(message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

// ─── Project API ─────────────────────────────────────────────────────────────

export async function createProject(
  input: Pick<Project, 'name' | 'language' | 'platform' | 'style' | 'humor'>,
) {
  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listProjects() {
  return request<Project[]>('/projects');
}

export async function getProject(slug: string) {
  return request<Project>(`/projects/${slug}`);
}

// ─── Generation API ───────────────────────────────────────────────────────────

export async function generateDirectorPlan(slug: string) {
  return request<DirectorPlan>(`/projects/${slug}/director-plan`, {
    method: 'POST',
  });
}

export async function generateStory(slug: string) {
  return request<Story>(`/projects/${slug}/story`, {
    method: 'POST',
  });
}

export async function generateScenes(slug: string) {
  return request<Scenes>(`/projects/${slug}/scenes`, {
    method: 'POST',
  });
}

export async function getDirectorPlan(slug: string) {
  return request<DirectorPlan>(`/projects/${slug}/director-plan`);
}

export async function getStory(slug: string) {
  return request<Story>(`/projects/${slug}/story`);
}

export async function getScenes(slug: string) {
  return request<Scenes>(`/projects/${slug}/scenes`);
}

export async function generateDialogues(slug: string) {
  return request<Dialogues>(`/projects/${slug}/dialogues`, {
    method: 'POST',
  });
}

export async function getDialogues(slug: string) {
  return request<Dialogues>(`/projects/${slug}/dialogues`);
}

export async function generatePrompts(slug: string) {
  return request<Prompts>(`/projects/${slug}/prompts`, {
    method: 'POST',
  });
}

export async function getPrompts(slug: string) {
  return request<Prompts>(`/projects/${slug}/prompts`);
}

export async function prepareVideo(slug: string) {
  return request<VideoPlan>(`/projects/${slug}/video`, { method: "POST" });
}

export async function getVideoPlan(slug: string) {
  return request<VideoPlan>(`/projects/${slug}/video`);
}

export async function renderVideo(slug: string) {
  return request<VideoPlan>(`/projects/${slug}/video/render`, { method: "POST" });
}

export async function generateSubtitles(slug: string) {
  return request<Subtitles>(`/projects/${slug}/subtitles`, { method: "POST" });
}

export async function getSubtitles(slug: string) {
  return request<Subtitles>(`/projects/${slug}/subtitles`);
}

export async function exportVideo(slug: string) {
  return request<{ path: string }>(`/projects/${slug}/export`, { method: "POST" });
}

// ─── Image Generation API ─────────────────────────────────────────────────────

export async function generateImages(slug: string) {
  return request<ImageGenerationResult[]>(`/projects/${slug}/images`, {
    method: 'POST',
  });
}

export async function getImages(slug: string) {
  return request<ImageGenerationResult[]>(`/projects/${slug}/images`);
}

export async function regenerateImage(slug: string, sceneId: string) {
  return request<ImageGenerationResult>(
    `/projects/${slug}/images/${sceneId}/regenerate`,
    { method: 'POST' },
  );
}

export async function getAssets(slug: string, type?: string) {
  const query = type ? `?type=${type}` : '';
  return request<Asset[]>(`/projects/${slug}/assets${query}`);
}

// ─── Scene Rendering API ──────────────────────────────────────────────────────

export async function renderScene(slug: string, sceneId: string) {
  return request<SceneRenderResult>(
    `/projects/${slug}/render/${sceneId}`,
    { method: 'POST' },
  );
}

export async function renderProject(slug: string) {
  return request<SceneRenderResult[]>(`/projects/${slug}/render`, {
    method: 'POST',
  });
}

// ─── Pipeline Status API ─────────────────────────────────────────────────────

export async function getPipelineStatus(slug: string) {
  return request<PipelineStatus>(`/projects/${slug}/pipeline`);
}

export async function retryStage(slug: string, stage: string) {
  return request<{ projectId: string; stage: string; status: string }>(
    `/projects/${slug}/pipeline/${stage}/retry`,
    { method: 'POST' },
  );
}

export async function resumePipeline(slug: string, stage: string) {
  return request<{ projectId: string; stage: string; status: string }>(
    `/projects/${slug}/pipeline/${stage}/resume`,
    { method: 'POST' },
  );
}

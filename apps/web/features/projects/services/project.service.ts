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
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
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

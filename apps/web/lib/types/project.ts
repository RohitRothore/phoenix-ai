export interface Project {
  id: string;
  name: string;
  slug: string;
  language: string;
  platform: string;
  style: string;
  humor: string;
  status: 'draft' | 'ready' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface DirectorArtifact {
  genre: string;
  targetAudience: string;
  tone: string;
  pacing: string;
  storyStructure: string[];
  visualStyle: string;
  comedyMechanics: string[];
  contentGuidelines: string;
  status: 'pending' | 'ready' | 'error';
  generatedAt?: string;
}

export interface StoryArtifact {
  logline: string;
  premise: string;
  synopsis: string;
  keyMoments: string[];
  status: 'pending' | 'ready' | 'error';
  generatedAt?: string;
}

export interface Scene {
  id: string;
  description: string;
  duration: number;
  visualPrompt: string;
  mood: string;
  status: 'pending' | 'ready' | 'error';
}

export interface SceneArtifact {
  scenes: Scene[];
  status: 'pending' | 'ready' | 'error';
  generatedAt?: string;
}

export interface DialogueLine {
  sceneId: string;
  character: string;
  line: string;
  emotion: string;
  timing: number;
}

export interface DialogueArtifact {
  scenes: DialogueScene[];
  status: 'pending' | 'ready' | 'error';
  generatedAt?: string;
}

export interface DialogueScene {
  id: string;
  lines: DialogueLine[];
}

export interface PromptScene {
  id: string;
  prompt: string;
  negativePrompt: string;
  duration: number;
  camera: string;
  lighting: string;
  mood: string;
}

export interface PromptArtifact {
  scenes: PromptScene[];
  status: 'pending' | 'ready' | 'error';
  generatedAt?: string;
}

export interface VideoArtifact {
  scenes: VideoScene[];
  status: 'pending' | 'ready' | 'error';
  renderStatus?: 'pending' | 'completed' | 'error';
  finalPath?: string;
  renderedAt?: string;
  resolution: string;
  frameRate: number;
  generatedAt?: string;
}

export interface VideoScene {
  id: string;
  duration: number;
  prompt: string;
  mood: string;
  scenePath: string;
  status: 'pending' | 'ready' | 'error';
}

export interface SubtitleArtifact {
  scenes: SubtitleScene[];
  srtPath: string;
  status: 'pending' | 'ready' | 'error';
  generatedAt?: string;
}

export interface SubtitleScene {
  id: string;
  lines: {
    start: number;
    end: number;
    text: string;
  }[];
}

export type ArtifactType =
  | 'director'
  | 'story'
  | 'scenes'
  | 'dialogues'
  | 'prompts'
  | 'video'
  | 'subtitles';

export interface ArtifactStatus {
  status: 'pending' | 'ready' | 'error';
}
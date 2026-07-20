export interface VideoInput {
  project: {
    topic: string;
    language: string;
    platform: string;
    style: string;
    humor: string;
  };
  scenes: Array<{
    id: number;
    title: string;
    act: string;
    duration: number;
    description: string;
    prompt: string;
    negativePrompt: string;
    camera: string;
    lighting: string;
    mood: string;
    dialogue: string;
    comedyElement: string;
  }>;
  resolution?: string;
  frameRate?: number;
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
  status: 'pending' | 'generating' | 'ready' | 'failed';
  errorMessage?: string;
  metadata?: {
    provider?: string;
    model?: string;
    generationTime?: number;
    seed?: string;
  };
}

export interface VideoOutput {
  scenes: VideoScene[];
  status: 'pending' | 'generating' | 'ready' | 'failed';
  generatedAt: string;
  resolution: string;
  frameRate: number;
}
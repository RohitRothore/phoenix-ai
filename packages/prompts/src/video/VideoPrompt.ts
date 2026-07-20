export interface VideoInput {
  project: {
    topic: string;
    language: string;
    platform: string;
    style: string;
    humor: string;
  };
  directorPlan: {
    genre: string;
    tone: string;
    pacing: string;
    visualStyle: string;
    comedyMechanics: string[];
  };
  scenes: Array<{
    id: number;
    title: string;
    act: string;
    duration: number;
    description: string;
    visualPrompt: string;
    dialogue: string;
    comedyElement: string;
  }>;
}

export interface VideoScene {
  id: number;
  scenePath: string;
  duration: number;
  prompt: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  errorMessage?: string;
}

export interface VideoOutput {
  scenes: VideoScene[];
  status: 'pending' | 'generating' | 'ready' | 'failed';
  generatedAt: string;
}
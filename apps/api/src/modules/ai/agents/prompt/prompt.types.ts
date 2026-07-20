import { DialogueOutput } from '../dialogue/dialogue.types';
import { DirectorOutput } from '../director/director.types';
import { SceneItem } from '../scene/scene.types';

export interface PromptInput {
  project: {
    language: string;
    platform: string;
    style: string;
  };
  directorPlan: DirectorOutput;
  scenes: SceneItem[];
  dialogues: DialogueOutput['scenes'];
}

export interface RenderPrompt {
  id: number;
  prompt: string;
  negativePrompt: string;
  camera: string;
  lighting: string;
  mood: string;
}

export interface PromptOutput {
  promptVersion: string;
  scenes: RenderPrompt[];
  generatedAt: string;
}

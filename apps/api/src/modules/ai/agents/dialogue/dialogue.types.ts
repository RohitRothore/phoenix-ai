import { DirectorOutput } from '../director/director.types';
import { StoryOutput } from '../story/story.types';

export interface DialogueInput {
  project: {
    topic: string;
    language: string;
    platform: string;
    style: string;
  };
  directorPlan: DirectorOutput;
  story: StoryOutput;
  scenes: Array<{
    id: number;
    title: string;
    act: string;
    duration: number;
    description: string;
    dialogue: string;
    visualPrompt: string;
    comedyElement: string;
  }>;
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

export interface DialogueOutput {
  scenes: SceneDialogue[];
  generatedAt: string;
}

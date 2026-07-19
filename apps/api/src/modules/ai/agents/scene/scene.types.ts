import { StoryOutput } from '../story/story.types';
import { DirectorOutput } from '../director/director.types';

export interface SceneInput {
  project: {
    topic: string;
    language: string;
    platform: string;
    style: string;
  };
  directorPlan: DirectorOutput;
  story: StoryOutput;
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

export interface SceneOutput {
  scenes: SceneItem[];
  generatedAt: string;
}

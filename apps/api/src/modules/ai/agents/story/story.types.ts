import { DirectorOutput } from '../director/director.types';

export interface StoryInput {
  project: {
    topic: string;
    language: string;
    platform: string;
    style: string;
    humor: string;
  };
  directorPlan: DirectorOutput;
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

export interface StoryOutput {
  title: string;
  hook: string;
  premise: string;
  summary: string;
  acts: StoryAct[];
  comedyBeat: string;
  ending: string;
  characters: StoryCharacter[];
  generatedAt: string;
}

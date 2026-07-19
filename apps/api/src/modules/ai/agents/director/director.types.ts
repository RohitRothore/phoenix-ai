export interface DirectorInput {
  topic: string;

  duration: number;

  humor: string;

  style: string;

  language: string;

  platform: string;
}

export interface DirectorOutput {
  genre: string;

  targetAudience: string;

  pacing: string;

  storyStructure: string[];
}

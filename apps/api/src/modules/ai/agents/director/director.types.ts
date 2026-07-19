export interface DirectorInput {
  topic: string;
  language: string;
  platform: string;
  style: string;
  humor: string;
}

export interface DirectorOutput {
  genre: string;
  targetAudience: string;
  tone: string;
  pacing: string;
  storyStructure: string[];
  visualStyle: string;
  comedyMechanics: string[];
  contentGuidelines: string;
  generatedAt: string;
}

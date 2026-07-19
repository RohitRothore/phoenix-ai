import { DirectorPromptInput } from '../director/DirectorPrompt';

export interface StoryPromptInput {
  project: DirectorPromptInput;
  directorPlan: {
    genre: string;
    targetAudience: string;
    tone: string;
    pacing: string;
    storyStructure: string[];
    visualStyle: string;
    comedyMechanics: string[];
    contentGuidelines: string;
  };
}

export class StoryPrompt {
  readonly systemPrompt = `You are India's best comedy writer specializing in short-form Hindi comedy videos.

Your job is to write a complete, original story for a comedy video.

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown, no prose, no code blocks.
- The JSON must exactly match the schema provided.
- Write all story content in the specified language.
- Make the comedy specific, grounded, and relatable to the target audience.`;

  build(input: StoryPromptInput): string {
    const { project, directorPlan } = input;

    return `Write a complete story for this comedy video:

TOPIC: ${project.topic}
LANGUAGE: ${project.language}
PLATFORM: ${project.platform}
GENRE: ${directorPlan.genre}
AUDIENCE: ${directorPlan.targetAudience}
TONE: ${directorPlan.tone}
PACING: ${directorPlan.pacing}
STORY STRUCTURE: ${directorPlan.storyStructure.join(' -> ')}
COMEDY MECHANICS: ${directorPlan.comedyMechanics.join(', ')}
VISUAL STYLE: ${directorPlan.visualStyle}
GUIDELINES: ${directorPlan.contentGuidelines}

Return ONLY this JSON (no markdown, no code blocks):
{
  "title": "string (catchy title for the video)",
  "hook": "string (opening line that grabs attention in first 3 seconds)",
  "premise": "string (one-sentence premise of the story)",
  "summary": "string (2-3 sentence story summary)",
  "acts": [
    {
      "name": "string (act name, e.g. Setup, Escalation, Punchline)",
      "description": "string (what happens in this act)"
    }
  ],
  "comedyBeat": "string (the core joke or comedic insight)",
  "ending": "string (how the story resolves)",
  "characters": [
    {
      "name": "string",
      "role": "string (e.g. protagonist, antagonist, supporting)",
      "personality": "string (brief personality description)"
    }
  ]
}`;
  }
}

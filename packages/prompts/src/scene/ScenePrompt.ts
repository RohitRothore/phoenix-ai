export interface ScenePromptInput {
  project: {
    topic: string;
    language: string;
    platform: string;
    style: string;
  };
  directorPlan: {
    genre: string;
    tone: string;
    pacing: string;
    visualStyle: string;
  };
  story: {
    title: string;
    premise: string;
    summary: string;
    acts: Array<{ name: string; description: string }>;
    characters: Array<{ name: string; role: string; personality: string }>;
  };
}

export class ScenePrompt {
  readonly systemPrompt = `You are a professional Scene Planner for an AI-powered animated comedy video studio.

Your job is to break a story into detailed, filmable scenes with precise visual descriptions.

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown, no prose, no code blocks.
- Each scene must be independently renderable by a video AI.
- Descriptions must be vivid, specific, and suitable for AI image/video generation.
- Keep total video duration under 60 seconds for short-form platforms.`;

  build(input: ScenePromptInput): string {
    const { project, directorPlan, story } = input;
    const actsText = story.acts
      .map((a) => `  - ${a.name}: ${a.description}`)
      .join('\n');
    const charactersText = story.characters
      .map((c) => `  - ${c.name} (${c.role}): ${c.personality}`)
      .join('\n');

    return `Break this story into scenes for video production:

PROJECT
Topic: ${project.topic}
Language: ${project.language}
Platform: ${project.platform}
Style: ${project.style}

STORY
Title: ${story.title}
Premise: ${story.premise}
Summary: ${story.summary}

ACTS:
${actsText}

CHARACTERS:
${charactersText}

DIRECTOR NOTES
Genre: ${directorPlan.genre}
Tone: ${directorPlan.tone}
Pacing: ${directorPlan.pacing}
Visual Style: ${directorPlan.visualStyle}

Return ONLY this JSON (no markdown, no code blocks):
{
  "scenes": [
    {
      "id": 1,
      "title": "string (short scene title)",
      "act": "string (which act this belongs to)",
      "duration": 8,
      "description": "string (detailed visual description for AI video generation, include: setting, characters present, action, camera angle, lighting mood)",
      "dialogue": "string (key dialogue or narration in the scene, in ${project.language})",
      "visualPrompt": "string (optimized prompt for AI video/image generation)",
      "comedyElement": "string (what makes this scene funny, if applicable)"
    }
  ]
}`;
  }
}

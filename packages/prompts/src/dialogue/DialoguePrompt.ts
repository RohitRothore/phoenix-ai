export interface DialoguePromptInput {
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
  };
  story: {
    title: string;
    hook: string;
    premise: string;
    summary: string;
    acts: Array<{ name: string; description: string }>;
    characters: Array<{ name: string; role: string; personality: string }>;
    comedyBeat: string;
    ending: string;
  };
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

export class DialoguePrompt {
  readonly systemPrompt = `You are a professional comedy dialogue writer for an AI-powered Hindi comedy video studio.

Your job is to write natural, funny, character-appropriate dialogue for each scene.

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown, no prose, no code blocks.
- The JSON must exactly match the schema provided.
- Write all dialogue in the specified language (Hindi/Hinglish unless told otherwise).
- Each character must speak in a distinct voice that matches their personality.
- Dialogue must be concise and punchy — short-form video pacing.
- Comedy should arise from character interactions, misunderstandings, and timing.`;

  build(input: DialoguePromptInput): string {
    const { project, directorPlan, story, scenes } = input;

    const charactersText = story.characters
      .map((c) => `  - ${c.name} (${c.role}): ${c.personality}`)
      .join('\n');

    const scenesText = scenes
      .map(
        (s) =>
          `Scene #${s.id} ("${s.title}"): ${s.description}`,
      )
      .join('\n\n');

    return `Write dialogue for all scenes in this comedy video:

PROJECT
Topic: ${project.topic}
Language: ${project.language}
Platform: ${project.platform}
Style: ${project.style}

DIRECTOR NOTES
Genre: ${directorPlan.genre}
Tone: ${directorPlan.tone}
Pacing: ${directorPlan.pacing}

STORY
Title: ${story.title}
Hook: ${story.hook}
Premise: ${story.premise}
Summary: ${story.summary}
Comedy Beat: ${story.comedyBeat}
Ending: ${story.ending}

CHARACTERS:
${charactersText}

SCENES:
${scenesText}

Return ONLY this JSON (no markdown, no code blocks):
{
  "scenes": [
    {
      "id": 1,
      "dialogue": [
        {
          "character": "string (character name)",
          "text": "string (dialogue line in ${project.language})",
          "emotion": "string (e.g. excited, angry, confused, sarcastic)",
          "timing": "string (e.g. opening, reaction, punchline)"
        }
      ]
    }
  ]
}`;
  }
}
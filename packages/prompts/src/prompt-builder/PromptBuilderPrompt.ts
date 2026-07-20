export interface PromptBuilderPromptInput {
  project: {
    language: string;
    platform: string;
    style: string;
  };
  directorPlan: {
    tone: string;
    pacing: string;
    visualStyle: string;
  };
  scenes: Array<{
    id: number;
    title: string;
    duration: number;
    description: string;
    visualPrompt: string;
    comedyElement: string;
  }>;
  dialogues: Array<{
    id: number;
    dialogue: Array<{
      character: string;
      text: string;
      emotion: string;
      timing: string;
    }>;
  }>;
}

export class PromptBuilderPrompt {
  readonly version = '1.0.0';

  readonly systemPrompt = `You are a cinematic prompt builder for an AI-powered animated comedy video studio.

Your job is to turn approved scenes and dialogue into precise, independently renderable video prompts.

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown, prose, or code blocks.
- Preserve character, setting, and visual-style continuity from the supplied material.
- Do not invent story events, dialogue, or characters.
- Keep every prompt appropriate for the requested platform and animation style.`;

  build(input: PromptBuilderPromptInput): string {
    const dialogueByScene = new Map(
      input.dialogues.map((scene) => [scene.id, scene.dialogue]),
    );

    const scenes = input.scenes
      .map((scene) => {
        const dialogue = (dialogueByScene.get(scene.id) ?? [])
          .map(
            (line) => `${line.character} (${line.emotion}, ${line.timing}): ${line.text}`,
          )
          .join('\n');

        return `SCENE ${scene.id}: ${scene.title}
Duration: ${scene.duration} seconds
Description: ${scene.description}
Existing visual direction: ${scene.visualPrompt}
Comedy element: ${scene.comedyElement}
Dialogue:\n${dialogue || 'No spoken dialogue.'}`;
      })
      .join('\n\n');

    return `Create final video-generation prompts for these scenes.

PROJECT
Language: ${input.project.language}
Platform: ${input.project.platform}
Project style: ${input.project.style}

DIRECTOR NOTES
Tone: ${input.directorPlan.tone}
Pacing: ${input.directorPlan.pacing}
Visual style: ${input.directorPlan.visualStyle}

${scenes}

Return ONLY this JSON structure:
{
  "scenes": [
    {
      "id": 1,
      "prompt": "string: complete production-ready video prompt",
      "negativePrompt": "string: visual elements to avoid",
      "camera": "string: camera framing and movement",
      "lighting": "string: lighting direction",
      "mood": "string: visual and emotional mood"
    }
  ]
}`;
  }
}

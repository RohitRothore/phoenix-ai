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
  readonly version = '2.0.0';

  readonly systemPrompt = `You are a PROMPT ENGINEER for AI-generated short-form comedy videos in VERTICAL format (9:16, 1080x1920) using Pollinations.ai (FLUX model).

You create SHORT, CONCISE prompts (max 100-150 characters) that generate stunning images.

PROMPT RULES:
1. Keep prompts UNDER 150 characters — short and direct works best for FLUX
2. Start with the SUBJECT and ACTION (e.g. "Indian man in office, wide-eyed, shocked")
3. Add SETTING/BACKGROUND briefly (e.g. "cluttered desk, fluorescent lights")
4. End with ART STYLE (e.g. "2D animation, vibrant colors, chibi style")
5. NO quality tags — FLUX handles quality natively, no need for "4K", "highly detailed", "sharp"
6. NO separate lighting/camera/mood — include them naturally in the description
7. Focus on ONE clear, specific visual moment per scene

COMEDY IMAGE RULES:
- Characters must have EXPRESSION-HEAVY faces (wide eyes, open mouths, raised eyebrows)
- Physical comedy poses (stumbling, pointing, dramatic gestures)
- Indian settings and cultural elements (offices, streets, homes, autos)
- Vibrant, saturated colors that pop on mobile screens

PROMPT STRUCTURE:
"[Subject] [action/expression], [setting], [art style]" — e.g. "Indian office worker staring at salary slip, eyes wide, jaw dropped, cluttered desk, 2D animated comedy, vibrant colors"`;

  build(input: PromptBuilderPromptInput): string {
    const dialogueByScene = new Map(
      input.dialogues.map((scene) => [scene.id, scene.dialogue]),
    );

    const scenes = input.scenes
      .map((scene) => {
        const dialogue = (dialogueByScene.get(scene.id) ?? [])
          .map(
            (line) =>
              `${line.character} [${line.emotion}, ${line.timing}]: "${line.text}"`,
          )
          .join('\n');

        return `SCENE ${scene.id}: ${scene.title}
Duration: ${scene.duration}s
Description: ${scene.description}
Comedy Element: ${scene.comedyElement}
Dialogue:\n${dialogue || 'No dialogue — pure visual comedy'}`;
      })
      .join('\n\n');

    return `Create CINEMATIC PRODUCTION PROMPTS for these comedy scenes.

PROJECT STYLE: ${input.project.style}
PLATFORM: ${input.project.platform}
TONE: ${input.directorPlan.tone}
VISUAL STYLE: ${input.directorPlan.visualStyle}

${scenes}

FOR EACH SCENE, create a SHORT, CONCISE prompt (UNDER 150 characters):
1. Describe the SUBJECT + ACTION/EXPRESSION (e.g. "man staring at phone, shocked face")
2. Include SETTING briefly (e.g. "office desk with papers scattered")
3. Add ART STYLE at the end (e.g. "2D animated comedy, vibrant colors")
4. NO quality tags — do NOT add "highly detailed", "sharp", "4K", "professional" etc.
5. NO separate lighting, camera, or mood fields — describe everything in the prompt naturally

Return ONLY this JSON structure:
{
  "scenes": [
    {
      "id": 1,
      "prompt": "SHORT concise prompt (max 150 chars) describing the scene subject, action, setting and art style. NO quality tags.",
      "negativePrompt": "text, watermark, blurry, ugly",
      "camera": "",
      "lighting": "",
      "mood": ""
    }
  ]
}`;
  }
}

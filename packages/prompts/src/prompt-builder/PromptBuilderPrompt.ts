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

  readonly systemPrompt = `You are a CINEMATIC PROMPT ENGINEER for AI-generated short-form comedy videos in VERTICAL format (9:16, 1080x1920).

You create prompts that generate STUNNING, CONSISTENT, PROFESSIONAL-QUALITY images for each scene.

PROMPT QUALITY RULES:
1. START with the art style (e.g. "2D animated, Pixar-style, anime, chibi, Indian comic book style")
2. Describe the EXACT FRAME: character positions, expressions, camera angle
3. Include LIGHTING details: warm/cool, dramatic/soft, time of day
4. Include MOOD: the emotional atmosphere of the frame
5. Add QUALITY TAGS: "highly detailed, sharp, vibrant colors, professional illustration"
6. Specify the ASPECT RATIO implicitly through composition (vertical, portrait)
7. Include NEGATIVE PROMPT: what to avoid (text, watermarks, blurry, extra limbs)

COMEDY IMAGE RULES:
- Characters must have EXPRESSION-HEAVY faces (wide eyes, open mouths, raised eyebrows)
- Physical comedy poses (stumbling, pointing, dramatic gestures)
- Indian settings and cultural elements (offices, streets, homes, autos)
- Vibrant, saturated colors that pop on mobile screens
- Clean backgrounds that don't distract from the characters

PROMPT STRUCTURE:
"[Art style], [Scene description], [Character details with expression], [Setting/background], [Camera angle], [Lighting], [Mood/atmosphere], [Quality tags]"`;

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

FOR EACH SCENE, create a prompt that:
1. Opens with the ART STYLE (e.g. "2D animated comedy, chibi-style, vibrant colors")
2. Describes the EXACT VERTICAL FRAME composition
3. Specifies character POSITIONS and EXPRESSIONS clearly
4. Includes SETTING and BACKGROUND details
5. Adds CAMERA ANGLE (close-up, medium, wide, low-angle, bird's-eye)
6. Specifies LIGHTING (warm office light, dramatic spotlight, natural daylight)
7. Sets the MOOD (playful, tense, chaotic, wholesome)
8. Ends with QUALITY TAGS ("highly detailed, sharp, professional, 4K")

Return ONLY this JSON structure:
{
  "scenes": [
    {
      "id": 1,
      "prompt": "complete cinematic prompt for AI image generation (start with art style, end with quality tags)",
      "negativePrompt": "text, watermark, blurry, extra fingers, deformed, low quality, cropped, ugly, duplicate",
      "camera": "specific camera angle and framing (e.g. 'medium close-up, character centered, slight low angle')",
      "lighting": "specific lighting setup (e.g. 'warm golden hour light from left, soft shadows')",
      "mood": "visual and emotional mood (e.g. 'playful chaos, vibrant energy')"
    }
  ]
}`;
  }
}

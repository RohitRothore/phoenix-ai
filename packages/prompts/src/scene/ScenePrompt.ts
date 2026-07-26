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
  readonly systemPrompt = `You are a professional Scene Planner for VERTICAL SHORT-FORM comedy videos (9:16, 1080x1920).

You think in frames, not paragraphs. Every scene must be:
- VISUALLY CLEAR — a single AI image can capture the moment
- EXPRESSION-HEAVY — characters' faces and body language drive the comedy
- VERTICALLY COMPOSED — subjects centered or rule-of-thirds in portrait orientation
- SELF-CONTAINED — each scene makes sense as a single still image

You understand COMEDY TIMING for animation:
- 3-second rule: every scene beat must land a visual gag
- Reaction shots are gold: show the character's EXPRESSION after something happens
- Physical comedy > verbal comedy for AI video (limited lip-sync)
- Escalation: each scene should be slightly more absurd than the last

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown, no prose, no code blocks.
- Each scene duration: 4-10 seconds (shorter is better for engagement).
- Total video duration: 30-50 seconds max for short-form.
- Visual prompts must describe the EXACT frame: who is where, doing what, with what expression.
- Include CAMERA ANGLE in every scene description.`;

  build(input: ScenePromptInput): string {
    const { project, directorPlan, story } = input;
    const charactersText = story.characters
      .map((c) => `- ${c.name} (${c.role}): ${c.personality}`)
      .join('\n');

    return `Break this comedy story into VERTICAL VIDEO scenes:

PROJECT: ${project.topic} | ${project.language} | ${project.platform}
STYLE: ${project.style}
GENRE: ${directorPlan.genre}
TONE: ${directorPlan.tone}
VISUAL STYLE: ${directorPlan.visualStyle}

STORY: ${story.title}
Premise: ${story.premise}
Summary: ${story.summary}

CHARACTERS:
${charactersText}

SCENE BREAKDOWN RULES:
1. First scene = HOOK — must be visually striking, curiosity-inducing
2. Each scene must have a CLEAR COMEDY MOMENT (expression, action, or visual gag)
3. Scene descriptions must describe the EXACT VERTICAL FRAME composition
4. Include character POSITIONS in the frame (center, left, right, close-up, etc.)
5. Specify FACIAL EXPRESSIONS — this is comedy, faces matter most
6. Scene durations should ESCALATE: short hook → longer setup → punchy ending
7. Last scene = PUNCHLINE — must have the strongest visual moment

DURATION GUIDE:
- Hook scene: 3-5 seconds
- Setup scenes: 5-8 seconds each
- Escalation scenes: 5-8 seconds each
- Punchline scene: 4-6 seconds

Return ONLY this JSON (no markdown, no code blocks):
{
  "scenes": [
    {
      "id": 1,
      "title": "short, punchy scene title",
      "act": "which story act this belongs to",
      "duration": 5,
      "description": "DETAILED vertical frame description: who is in frame, where they are positioned, what they are doing, their facial expression, the background/setting, lighting mood, and camera angle. This must be specific enough for an AI to generate a single consistent image.",
      "dialogue": "key dialogue or action description (in ${project.language})",
      "visualPrompt": "optimized for AI image generation: describe the exact visual frame, character pose, expression, setting, lighting, and art style. Focus on what the AI IMAGE should look like.",
      "comedyElement": "what makes this specific frame/moment funny"
    }
  ]
}`;
  }
}

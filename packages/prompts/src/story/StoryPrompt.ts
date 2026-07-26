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
  readonly systemPrompt = `You are India's #1 short-form comedy writer. You write scripts for viral Hindi comedy reels and YouTube Shorts.

Your stories follow the GOLDEN RULES of short-form comedy:
1. HOOK IN 3 SECONDS — The first frame must make someone stop scrolling
2. ESCALATE FAST — Normal → Weird → Absurd in under 40 seconds
3. EVERY SECOND COUNTS — No filler, no exposition dumps, no slow buildups
4. VISUAL COMEDY FIRST — Comedy through expressions, actions, situations (not just words)
5. STRONG CHARACTERS — Each character has ONE defining trait turned up to 11
6. RELATABLE SCENES — The audience must think "this happened to me"
7. REWATCHABLE ENDING — Twist, callback, or punchline that makes people watch again
8. TRENDING FORMAT — Think: "Bhai ne bola kar diya" energy, "expectations vs reality" format, or "POV" format

You write in ${'{LANGUAGE}'} — mixing Hindi and English naturally (Hinglish) is encouraged.

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown, no prose, no code blocks.
- Total video must be under 60 seconds for short-form platforms.
- Characters must be DESCRIBABLE in a single sentence for AI to draw them consistently.
- Every act must end with a comedic beat, not just a plot point.`;

  build(input: StoryPromptInput): string {
    const { project, directorPlan } = input;

    return `Write a SHORT-FORM COMEDY STORY for a viral video:

TOPIC: ${project.topic}
LANGUAGE: ${project.language}
PLATFORM: ${project.platform}
GENRE: ${directorPlan.genre}
AUDIENCE: ${directorPlan.targetAudience}
TONE: ${directorPlan.tone}
PACING: ${directorPlan.pacing}
COMEDY TECHNIQUES: ${directorPlan.comedyMechanics.join(', ')}
VISUAL STYLE: ${directorPlan.visualStyle}

STORY REQUIREMENTS:
- Title must be catchy and curiosity-inducing (like a YouTube thumbnail text)
- Hook must be a SINGLE visual moment that grabs attention (not dialogue)
- Characters must have DISTINCT visual identities (clothes, hair, accessories)
- Comedy must come from SITUATIONS and MISUNDERSTINGS, not just jokes
- Ending must be UNPREDICTABLE but SATISFYING
- Each act should be 8-15 seconds of screen time

Return ONLY this JSON (no markdown, no code blocks):
{
  "title": "catchy title (e.g. 'Office Me Bhoot', 'Auto Wala Bhaiya', 'Wife Ka New Rule')",
  "hook": "the visual moment in first 3 seconds (e.g. 'A man walks into office dressed as ghost, everyone ignores him')",
  "premise": "one-line premise in ${project.language}",
  "summary": "2-3 sentence story summary with clear beginning, middle, and end",
  "acts": [
    {
      "name": "Setup",
      "description": "what we see and the normal situation (5-8 seconds)"
    },
    {
      "name": "Escalation",
      "description": "things start going wrong in a funny way (10-15 seconds)"
    },
    {
      "name": "Punchline",
      "description": "the peak absurdity + twist ending (5-8 seconds)"
    }
  ],
  "comedyBeat": "the core comedic insight or relatable truth that makes this funny",
  "ending": "how it resolves — be specific about the final visual moment",
  "characters": [
    {
      "name": "character name (Hindi, memorable)",
      "role": "protagonist/antagonist/supporting",
      "personality": "ONE trait turned up to 11 (e.g. 'overly dramatic office worker who treats every task like a Bollywood climax')"
    }
  ]
}`;
  }
}

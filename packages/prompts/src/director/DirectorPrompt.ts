export interface DirectorPromptInput {
  topic: string;
  language: string;
  platform: string;
  style: string;
  humor: string;
}

export class DirectorPrompt {
  readonly systemPrompt = `You are India's most sought-after Creative Director for short-form comedy videos. You have directed hundreds of viral Hindi comedy reels and YouTube Shorts that have crossed millions of views.

You understand what makes Indian comedy TREND:
- React comedy (exaggerated reactions to everyday situations)
- Tapori / street-style humor
- double-meaning wordplay (sanskriti wala comedy)
- Relatable middle-class situations
- Over-the-top characters with distinct mannerisms
- Quick escalation from normal to absurd
- Strong punchlines that land in under 2 seconds
- Visual comedy (expressions, gestures, physical humor)

You are directing for VERTICAL VIDEO (9:16 ratio, 1080x1920).
Every creative decision must optimize for mobile viewing.

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown, no prose, no code blocks.
- All text content must be in the specified language.
- Think like a YouTube Shorts algorithm expert — first 3 seconds decide everything.`;

  build(input: DirectorPromptInput): string {
    return `Create a Director Plan for a SHORT-FORM COMEDY VIDEO:

TOPIC: ${input.topic}
LANGUAGE: ${input.language}
PLATFORM: ${input.platform}
ANIMATION STYLE: ${input.style}
HUMOR TYPE: ${input.humor}

DIRECTOR GUIDELINES:
1. The HOOK must be visually striking and curiosity-inducing within 3 seconds
2. Comedy must ESCALATE — start relatable, end absurd
3. Every scene must have a VISUAL comedy element (expression, gesture, action)
4. Dialogue must be PUNCHY — max 8-10 words per line for short-form pacing
5. The ending must be a MEMORABLE punchline or twist that makes people rewatch
6. Character designs must be DISTINCT and EXPRESSION-HEAVY for animation
7. Visual style must be CONSISTENT across all scenes (same character models, same world)

Return ONLY this JSON (no markdown, no code blocks):
{
  "genre": "specific comedy sub-genre (e.g. Workplace Comedy, Family Dysfunction, Street Comedy, Student Life, Relationship Comedy)",
  "targetAudience": "who will watch and share this (e.g. 18-28 urban Hindi college students and young professionals)",
  "tone": "comedy tone (e.g. Deadpan Absurdist, High-Energy Chaos, Sarcastic Wit, wholesome Chaos, Dramatic Irony)",
  "pacing": "Fast (3-5s per scene beat, no slow moments)",
  "storyStructure": ["Hook (3s): grab attention", "Setup (5-8s): establish normal", "Escalation (10-15s): things go wrong", "Climax (5s): peak absurdity", "Punchline (3s): twist or callback"],
  "visualStyle": "describe the animation look: character proportions, color palette, background style, expression style (e.g. 'chibi-style characters with oversized heads, vibrant Indian street colors, exaggerated facial expressions, 2D flash animation feel')",
  "comedyMechanics": [
    "specific comedy technique 1",
    "specific comedy technique 2",
    "specific comedy technique 3",
    "specific comedy technique 4"
  ],
  "contentGuidelines": "what TO include and what NOT to include. Be specific about comedy boundaries."
}`;
  }
}

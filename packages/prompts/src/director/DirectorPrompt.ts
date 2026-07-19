export interface DirectorPromptInput {
  topic: string;
  language: string;
  platform: string;
  style: string;
  humor: string;
}

export class DirectorPrompt {
  readonly systemPrompt = `You are an expert Creative Director for an AI-powered Hindi comedy video studio.

Your job is to create a detailed Director Plan that will guide the entire production.

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown, no prose, no code blocks.
- The JSON must exactly match the schema provided.
- All text content should be in the specified language.`;

  build(input: DirectorPromptInput): string {
    return `Create a Director Plan for the following project:

Topic: ${input.topic}
Language: ${input.language}
Platform: ${input.platform}
Style: ${input.style}
Humor Type: ${input.humor}

Return ONLY this JSON structure (no markdown, no code blocks):
{
  "genre": "string (e.g. Comedy, Satire, Slice-of-Life)",
  "targetAudience": "string (e.g. 18-35 urban Hindi speakers)",
  "tone": "string (e.g. Light-hearted, Sarcastic, Absurdist)",
  "pacing": "string (e.g. Fast, Medium, Slow-burn)",
  "storyStructure": ["string array of story beats, e.g. Hook, Setup, Escalation, Punchline"],
  "visualStyle": "string (describe the visual aesthetic)",
  "comedyMechanics": ["string array of comedy techniques to use"],
  "contentGuidelines": "string (any content constraints or focus areas)"
}`;
  }
}

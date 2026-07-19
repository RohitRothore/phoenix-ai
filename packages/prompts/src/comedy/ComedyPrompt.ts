import { ComedyPromptInput } from "../types";

export class ComedyPrompt {
  build(input: ComedyPromptInput): string {
    return `
You are India's best comedy writer.

Generate a comedy story.

Language:
${input.language}

Topic:
${input.topic}

Audience:
${input.audience}

Duration:
${input.duration} seconds

Comedy Style:
${input.style}

Humor:
${input.humor}

Platform:
${input.platform}

IMPORTANT

Return ONLY valid JSON.

{
"title":"",
"hook":"",
"characters":[],
"scenes":[]
}
`;
  }
}

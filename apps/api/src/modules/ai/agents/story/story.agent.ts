import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProviderRegistry } from '@phoenix/providers';
import { StoryPrompt } from '@phoenix/prompts';

import { PROVIDER_REGISTRY } from '../../../provider/provider.module';
import { StoryInput, StoryOutput } from './story.types';

@Injectable()
export class StoryAgent {
  private readonly logger = new Logger(StoryAgent.name);
  private readonly prompt = new StoryPrompt();

  constructor(
    @Inject(PROVIDER_REGISTRY) private readonly registry: ProviderRegistry,
  ) {}

  async execute(input: StoryInput): Promise<StoryOutput> {
    this.logger.log(`Generating story for topic: "${input.project.topic}"`);

    const provider = this.registry.get('gemini');

    const userPrompt = this.prompt.build({
      project: {
        topic: input.project.topic,
        language: input.project.language,
        platform: input.project.platform,
        style: input.project.style,
        humor: input.project.humor,
      },
      directorPlan: input.directorPlan,
    });

    const response = await provider.generateText({
      systemPrompt: this.prompt.systemPrompt,
      prompt: userPrompt,
      temperature: 0.9,
    });

    const parsed = this.parseJson<Omit<StoryOutput, 'generatedAt'>>(
      response.text,
      input,
    );

    const output: StoryOutput = {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };

    this.logger.log(`Story generated: title="${output.title}"`);

    return output;
  }

  private parseJson<T>(text: string, input: StoryInput): T {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.error(
        `StoryAgent: Failed to parse JSON response. Raw text: ${text}`,
      );
      // Graceful fallback
      return {
        title: input.project.topic,
        hook: `A funny take on ${input.project.topic}`,
        premise: `This is a comedy about ${input.project.topic}.`,
        summary: `A story about ${input.project.topic} that makes the audience laugh.`,
        acts: [
          { name: 'Setup', description: 'The scene is established.' },
          { name: 'Escalation', description: 'Things get out of hand.' },
          { name: 'Punchline', description: 'The comedy lands.' },
        ],
        comedyBeat: 'Situational irony',
        ending: 'Everyone learns a lesson and laughs.',
        characters: [
          {
            name: 'Protagonist',
            role: 'protagonist',
            personality: 'Relatable and funny',
          },
        ],
      } as unknown as T;
    }
  }
}

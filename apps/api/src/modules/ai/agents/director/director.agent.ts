import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProviderRegistry } from '@phoenix/providers';
import { DirectorPrompt } from '@phoenix/prompts';

import { PROVIDER_REGISTRY } from '../../../provider/provider.module';
import { DirectorInput, DirectorOutput } from './director.types';

@Injectable()
export class DirectorAgent {
  private readonly logger = new Logger(DirectorAgent.name);
  private readonly prompt = new DirectorPrompt();

  constructor(
    @Inject(PROVIDER_REGISTRY) private readonly registry: ProviderRegistry,
  ) {}

  async execute(input: DirectorInput): Promise<DirectorOutput> {
    this.logger.log(`Generating director plan for topic: "${input.topic}"`);

    const provider = this.registry.get('gemini');

    const userPrompt = this.prompt.build({
      topic: input.topic,
      language: input.language,
      platform: input.platform,
      style: input.style,
      humor: input.humor,
    });

    const response = await provider.generateText({
      systemPrompt: this.prompt.systemPrompt,
      prompt: userPrompt,
      temperature: 0.8,
    });

    const parsed = this.parseJson<Omit<DirectorOutput, 'generatedAt'>>(
      response.text,
      input,
    );

    const output: DirectorOutput = {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };

    this.logger.log(`Director plan generated: genre="${output.genre}"`);

    return output;
  }

  private parseJson<T>(text: string, input: DirectorInput): T {
    // Strip markdown code fences if the model wraps JSON in them
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.error(
        `DirectorAgent: Failed to parse JSON response. Raw text: ${text}`,
      );
      // Return a graceful fallback so the pipeline does not crash
      return {
        genre: 'Comedy',
        targetAudience: '18-35',
        tone: input.humor,
        pacing: 'Fast',
        storyStructure: ['Hook', 'Setup', 'Conflict', 'Punchline'],
        visualStyle: input.style,
        comedyMechanics: ['Situational comedy', 'Relatable characters'],
        contentGuidelines: 'Family-friendly comedy',
      } as unknown as T;
    }
  }
}

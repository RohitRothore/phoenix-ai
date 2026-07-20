import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProviderRegistry } from '@phoenix/providers';
import { DialoguePrompt } from '@phoenix/prompts';

import { PROVIDER_REGISTRY } from '../../../provider/provider.module';
import { DialogueInput, DialogueOutput } from './dialogue.types';

@Injectable()
export class DialogueAgent {
  private readonly logger = new Logger(DialogueAgent.name);
  private readonly prompt = new DialoguePrompt();

  constructor(
    @Inject(PROVIDER_REGISTRY) private readonly registry: ProviderRegistry,
  ) {}

  async execute(input: DialogueInput): Promise<DialogueOutput> {
    this.logger.log(`Generating dialogue for story: "${input.story.title}"`);

    const provider = this.registry.get('gemini');

    const userPrompt = this.prompt.build({
      project: input.project,
      directorPlan: {
        genre: input.directorPlan.genre,
        tone: input.directorPlan.tone,
        pacing: input.directorPlan.pacing,
      },
      story: input.story,
      scenes: input.scenes,
    });

    const response = await provider.generateText({
      systemPrompt: this.prompt.systemPrompt,
      prompt: userPrompt,
      temperature: 0.8,
    });

    const parsed = this.parseJson<{ scenes: DialogueOutput['scenes'] }>(
      response.text,
      input,
    );

    const output: DialogueOutput = {
      scenes: parsed.scenes,
      generatedAt: new Date().toISOString(),
    };

    this.logger.log(`Dialogue generated: scenes=${output.scenes.length}`);

    return output;
  }

  private parseJson<T>(text: string, input: DialogueInput): T {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.error(
        `DialogueAgent: Failed to parse JSON response. Raw text: ${text}`,
      );
      // Graceful fallback — assign empty dialogue per scene
      return {
        scenes: input.scenes.map((s) => ({
          id: s.id,
          dialogue: [
            {
              character: 'Narrator',
              text: `Scene ${s.id}: ${s.description}`,
              emotion: 'neutral',
              timing: 'description',
            },
          ],
        })),
      } as unknown as T;
    }
  }
}

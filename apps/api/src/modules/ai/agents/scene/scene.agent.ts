import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProviderRegistry } from '@phoenix/providers';
import { ScenePrompt } from '@phoenix/prompts';

import { PROVIDER_REGISTRY } from '../../../provider/provider.module';
import { SceneInput, SceneOutput } from './scene.types';

@Injectable()
export class SceneAgent {
  private readonly logger = new Logger(SceneAgent.name);
  private readonly prompt = new ScenePrompt();

  constructor(
    @Inject(PROVIDER_REGISTRY) private readonly registry: ProviderRegistry,
  ) {}

  async execute(input: SceneInput): Promise<SceneOutput> {
    this.logger.log(`Generating scenes for story: "${input.story.title}"`);

    const provider = this.registry.get('gemini');

    const userPrompt = this.prompt.build({
      project: input.project,
      directorPlan: {
        genre: input.directorPlan.genre,
        tone: input.directorPlan.tone,
        pacing: input.directorPlan.pacing,
        visualStyle: input.directorPlan.visualStyle,
      },
      story: {
        title: input.story.title,
        premise: input.story.premise,
        summary: input.story.summary,
        acts: input.story.acts,
        characters: input.story.characters,
      },
    });

    const response = await provider.generateText({
      systemPrompt: this.prompt.systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    const parsed = this.parseJson<{ scenes: SceneOutput['scenes'] }>(
      response.text,
      input,
    );

    const output: SceneOutput = {
      scenes: parsed.scenes,
      generatedAt: new Date().toISOString(),
    };

    this.logger.log(`Scenes generated: count=${output.scenes.length}`);

    return output;
  }

  private parseJson<T>(text: string, input: SceneInput): T {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.error(
        `SceneAgent: Failed to parse JSON response. Raw text: ${text}`,
      );
      // Graceful fallback
      return {
        scenes: input.story.acts.map((act, index) => ({
          id: index + 1,
          title: act.name,
          act: act.name,
          duration: 10,
          description: act.description,
          dialogue: '',
          visualPrompt: `${input.directorPlan.visualStyle} animation style, ${act.description}`,
          comedyElement: '',
        })),
      } as unknown as T;
    }
  }
}

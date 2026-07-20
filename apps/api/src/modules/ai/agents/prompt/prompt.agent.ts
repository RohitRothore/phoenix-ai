import { Inject, Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { Agent } from '@phoenix/ai-core';
import { PromptBuilderPrompt } from '@phoenix/prompts';
import { ProviderRegistry } from '@phoenix/providers';

import { PROVIDER_REGISTRY } from '../../../provider/provider.module';
import { PromptInput, PromptOutput, RenderPrompt } from './prompt.types';

@Injectable()
export class PromptAgent implements Agent<PromptInput, PromptOutput> {
  private readonly logger = new Logger(PromptAgent.name);
  private readonly prompt = new PromptBuilderPrompt();

  constructor(
    @Inject(PROVIDER_REGISTRY) private readonly registry: ProviderRegistry,
  ) {}

  async execute(input: PromptInput): Promise<PromptOutput> {
    this.logger.log(`Building render prompts for ${input.scenes.length} scenes`);

    const provider = this.registry.get('gemini');
    const response = await provider.generateText({
      systemPrompt: this.prompt.systemPrompt,
      prompt: this.prompt.build(input),
      temperature: 0.4,
    });

    const scenes = this.parseScenes(response.text, input.scenes.map((scene) => scene.id));

    return {
      promptVersion: this.prompt.version,
      scenes,
      generatedAt: new Date().toISOString(),
    };
  }

  private parseScenes(text: string, expectedSceneIds: number[]): RenderPrompt[] {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new UnprocessableEntityException('The AI provider returned invalid JSON for render prompts.');
    }

    if (!isPromptResponse(parsed)) {
      throw new UnprocessableEntityException('The AI provider returned an invalid render-prompt schema.');
    }

    const returnedIds = new Set(parsed.scenes.map((scene) => scene.id));
    const containsEveryScene = expectedSceneIds.every((id) => returnedIds.has(id));
    if (parsed.scenes.length !== expectedSceneIds.length || !containsEveryScene) {
      throw new UnprocessableEntityException('The AI provider did not return exactly one prompt for every scene.');
    }

    return parsed.scenes;
  }
}

function isPromptResponse(value: unknown): value is { scenes: RenderPrompt[] } {
  if (!isRecord(value) || !Array.isArray(value.scenes)) {
    return false;
  }

  return value.scenes.every(isRenderPrompt);
}

function isRenderPrompt(value: unknown): value is RenderPrompt {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.prompt === 'string' &&
    typeof value.negativePrompt === 'string' &&
    typeof value.camera === 'string' &&
    typeof value.lighting === 'string' &&
    typeof value.mood === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

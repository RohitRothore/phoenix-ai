import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';

import { PROVIDER_REGISTRY } from '../provider/provider.module';
import { ProviderRegistry } from '@phoenix/providers';
import { RenderPrompt } from '../ai/agents/prompt/prompt.types';

/**
 * PromptEnhancerService
 *
 * Enhances scene prompts with additional detail for image generation.
 * In Phase 2, this can be replaced with an AI-based prompt enhancer.
 * For Phase 1, it applies deterministic transformations.
 */
@Injectable()
export class PromptEnhancerService {
  private readonly logger = new Logger(PromptEnhancerService.name);

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
  ) {}

  enhancePrompt(prompt: RenderPrompt): RenderPrompt {
    // Enhance the prompt with lighting, camera, and mood details
    const enhanced = `${prompt.prompt}, ${prompt.lighting ?? 'natural lighting'}, ${prompt.camera ?? 'medium shot'}, ${prompt.mood ?? 'neutral mood'}`;

    return {
      ...prompt,
      prompt: enhanced,
    };
  }

  enhancePrompts(prompts: RenderPrompt[]): RenderPrompt[] {
    return prompts.map((p) => this.enhancePrompt(p));
  }
}

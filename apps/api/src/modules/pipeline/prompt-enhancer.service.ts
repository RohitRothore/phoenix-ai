import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';

import { PROVIDER_REGISTRY } from '../provider/provider.module';
import { ProviderRegistry } from '@phoenix/providers';
import { RenderPrompt } from '../ai/agents/prompt/prompt.types';

@Injectable()
export class PromptEnhancerService {
  private readonly logger = new Logger(PromptEnhancerService.name);

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
  ) {}

  enhancePrompt(prompt: RenderPrompt): RenderPrompt {
    // For Pollinations.ai (FLUX), keep prompts short and natural.
    // No quality tags needed — FLUX handles quality natively.
    // The prompt builder already generates concise prompts optimized for Pollinations.
    return {
      ...prompt,
      negativePrompt: prompt.negativePrompt || 'text, watermark, blurry, ugly',
    };
  }

  enhancePrompts(prompts: RenderPrompt[]): RenderPrompt[] {
    return prompts.map((p) => this.enhancePrompt(p));
  }
}

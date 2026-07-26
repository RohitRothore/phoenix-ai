import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';

import { PROVIDER_REGISTRY } from '../provider/provider.module';
import { ProviderRegistry } from '@phoenix/providers';
import { RenderPrompt } from '../ai/agents/prompt/prompt.types';

@Injectable()
export class PromptEnhancerService {
  private readonly logger = new Logger(PromptEnhancerService.name);

  private static readonly QUALITY_TAGS = [
    'highly detailed',
    'sharp focus',
    'vibrant colors',
    'professional illustration',
    '4K quality',
    'clean composition',
  ];

  private static readonly NEGATIVE_PROMPT_BASE = [
    'text',
    'watermark',
    'blurry',
    'extra fingers',
    'deformed',
    'low quality',
    'cropped',
    'ugly',
    'duplicate',
    'out of frame',
    'disfigured',
    'bad anatomy',
  ].join(', ');

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
  ) {}

  enhancePrompt(prompt: RenderPrompt): RenderPrompt {
    const enhancedParts: string[] = [];

    enhancedParts.push(prompt.prompt);

    if (prompt.lighting) {
      enhancedParts.push(prompt.lighting);
    } else {
      enhancedParts.push('natural cinematic lighting');
    }

    if (prompt.camera) {
      enhancedParts.push(prompt.camera);
    } else {
      enhancedParts.push('medium shot');
    }

    if (prompt.mood) {
      enhancedParts.push(`${prompt.mood} atmosphere`);
    }

    const qualitySuffix = PromptEnhancerService.QUALITY_TAGS.join(', ');
    enhancedParts.push(qualitySuffix);

    return {
      ...prompt,
      prompt: enhancedParts.join(', '),
      negativePrompt:
        prompt.negativePrompt || PromptEnhancerService.NEGATIVE_PROMPT_BASE,
    };
  }

  enhancePrompts(prompts: RenderPrompt[]): RenderPrompt[] {
    return prompts.map((p) => this.enhancePrompt(p));
  }
}

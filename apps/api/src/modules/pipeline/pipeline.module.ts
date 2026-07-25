import { Module } from '@nestjs/common';

import { ProviderModule } from '../provider/provider.module';
import { StorageModule } from '../../common/storage/storage.module';
import { ImageGenerationService } from './image-generation.service';
import { PromptEnhancerService } from './prompt-enhancer.service';
import { SceneRendererService } from './scene-renderer.service';
import { VoiceGenerationService } from './voice-generation.service';
import { CompositionService } from './composition.service';

@Module({
  imports: [ProviderModule, StorageModule],
  providers: [
    ImageGenerationService,
    PromptEnhancerService,
    SceneRendererService,
    VoiceGenerationService,
    CompositionService,
  ],
  exports: [
    ImageGenerationService,
    PromptEnhancerService,
    SceneRendererService,
    VoiceGenerationService,
    CompositionService,
  ],
})
export class PipelineModule {}

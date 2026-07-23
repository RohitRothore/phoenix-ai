import { Module } from '@nestjs/common';

import { ProviderModule } from '../provider/provider.module';
import { StorageModule } from '../../common/storage/storage.module';
import { ImageGenerationService } from './image-generation.service';
import { PromptEnhancerService } from './prompt-enhancer.service';
import { SceneRendererService } from './scene-renderer.service';

@Module({
  imports: [ProviderModule, StorageModule],
  providers: [
    ImageGenerationService,
    PromptEnhancerService,
    SceneRendererService,
  ],
  exports: [
    ImageGenerationService,
    PromptEnhancerService,
    SceneRendererService,
  ],
})
export class PipelineModule {}

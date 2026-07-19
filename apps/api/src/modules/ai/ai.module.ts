import { Module } from '@nestjs/common';

import { ProviderModule } from '../provider/provider.module';
import { DirectorAgent } from './agents/director/director.agent';
import { SceneAgent } from './agents/scene/scene.agent';
import { StoryAgent } from './agents/story/story.agent';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [ProviderModule],
  controllers: [AiController],
  providers: [AiService, DirectorAgent, StoryAgent, SceneAgent],
  exports: [DirectorAgent, StoryAgent, SceneAgent],
})
export class AiModule {}

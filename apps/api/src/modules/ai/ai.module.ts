import { Module } from '@nestjs/common';

import { ProviderModule } from '../provider/provider.module';
import { DialogueAgent } from './agents/dialogue/dialogue.agent';
import { DirectorAgent } from './agents/director/director.agent';
import { SceneAgent } from './agents/scene/scene.agent';
import { StoryAgent } from './agents/story/story.agent';
import { VideoAgent } from './agents/video/video.agent';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [ProviderModule],
  controllers: [AiController],
  providers: [
    AiService,
    DirectorAgent,
    StoryAgent,
    SceneAgent,
    DialogueAgent,
    VideoAgent,
  ],
  exports: [DirectorAgent, StoryAgent, SceneAgent, DialogueAgent, VideoAgent],
})
export class AiModule {}
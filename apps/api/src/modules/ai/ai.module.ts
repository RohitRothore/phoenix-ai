import { Module } from '@nestjs/common';

import { ProviderModule } from '../provider/provider.module';
import { DialogueAgent } from './agents/dialogue/dialogue.agent';
import { DirectorAgent } from './agents/director/director.agent';
import { SceneAgent } from './agents/scene/scene.agent';
import { StoryAgent } from './agents/story/story.agent';
import { PromptAgent } from './agents/prompt/prompt.agent';
import { VideoAgent } from './agents/video/video.agent';
import { VideoPreparationPipeline } from './pipelines/video-preparation.pipeline';
import { SubtitlePipeline } from './pipelines/subtitle.pipeline';
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
    PromptAgent,
    VideoAgent,
    VideoPreparationPipeline,
    SubtitlePipeline,
  ],
  exports: [DirectorAgent, StoryAgent, SceneAgent, DialogueAgent, PromptAgent, VideoAgent, VideoPreparationPipeline, SubtitlePipeline],
})
export class AiModule {}

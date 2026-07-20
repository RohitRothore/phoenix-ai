import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Agent, MediaProvider } from '@phoenix/ai-core';

import { VideoInput, VideoOutput } from './video.types';
import { PROVIDER_REGISTRY } from '../../../provider/provider.module';
import { ProviderRegistry } from '@phoenix/providers';

@Injectable()
export class VideoAgent implements Agent<VideoInput, VideoOutput> {
  private readonly logger = new Logger(VideoAgent.name);

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
  ) {}

  async execute(input: VideoInput): Promise<VideoOutput> {
    this.logger.log(
      `Preparing video generation for ${input.scenes.length} scenes`,
    );

    const mediaProvider = this.registry.getMediaProvider();
    const scenes: VideoOutput['scenes'] = [];

    for (const scene of input.scenes) {
      let scenePath = `video/scene-${scene.id.toString().padStart(3, '0')}.mp4`;
      let status: VideoOutput['scenes'][number]['status'] = 'pending';

      // Try to use real media provider if available
      if (mediaProvider) {
        try {
          const videoResult = await mediaProvider.generateVideo({
            prompt: scene.prompt,
            negativePrompt: scene.negativePrompt,
            duration: scene.duration,
            resolution: input.resolution,
            frameRate: input.frameRate,
          });
          scenePath = videoResult.videoPath;
          status = 'ready';
        } catch (e) {
          const error = e as Error;
          this.logger.warn(
            `Media provider failed for scene ${scene.id}, using placeholder: ${error.message}`,
          );
          status = 'failed';
        }
      }

      scenes.push({
        id: scene.id,
        scenePath,
        duration: scene.duration,
        prompt: scene.prompt,
        negativePrompt: scene.negativePrompt,
        camera: scene.camera,
        lighting: scene.lighting,
        mood: scene.mood,
        status,
      });
    }

    const output: VideoOutput = {
      scenes,
      status: 'ready',
      generatedAt: new Date().toISOString(),
      resolution: input.resolution || '1080x1920',
      frameRate: input.frameRate || 30,
    };

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    this.logger.log(
      `Video metadata prepared: totalScenes=${scenes.length}, totalDuration=${totalDuration}s`,
    );

    return output;
  }
}
import { Injectable, Logger } from '@nestjs/common';

import { VideoInput, VideoOutput } from './video.types';

@Injectable()
export class VideoAgent {
  private readonly logger = new Logger(VideoAgent.name);

  execute(input: VideoInput): VideoOutput {
    this.logger.log(
      `Preparing video generation for ${input.scenes.length} scenes`,
    );

    const scenes = input.scenes.map((scene) => ({
      id: scene.id,
      scenePath: `video/scene-${scene.id.toString().padStart(3, '0')}.mp4`,
      duration: scene.duration,
      prompt: scene.visualPrompt,
      status: 'pending' as const,
    }));

    const output: VideoOutput = {
      scenes,
      status: 'pending',
      generatedAt: new Date().toISOString(),
    };

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    this.logger.log(
      `Video metadata prepared: totalScenes=${scenes.length}, totalDuration=${totalDuration}s`,
    );

    return output;
  }
}
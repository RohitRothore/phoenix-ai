import { Injectable, Logger } from '@nestjs/common';
import { Agent } from '@phoenix/ai-core';

import { VideoInput, VideoOutput } from './video.types';

@Injectable()
export class VideoAgent implements Agent<VideoInput, VideoOutput> {
  private readonly logger = new Logger(VideoAgent.name);

  async execute(input: VideoInput): Promise<VideoOutput> {
    this.logger.log(
      `Preparing video generation for ${input.scenes.length} scenes`,
    );

    const scenes = input.scenes.map((scene) => ({
      id: scene.id,
      scenePath: `video/scene-${scene.id.toString().padStart(3, '0')}.mp4`,
      duration: scene.duration,
      prompt: scene.prompt,
      negativePrompt: scene.negativePrompt,
      camera: scene.camera,
      lighting: scene.lighting,
      mood: scene.mood,
      status: 'pending' as const,
    }));

    const output: VideoOutput = {
      scenes,
      status: 'pending',
      generatedAt: new Date().toISOString(),
      resolution: '1080x1920',
      frameRate: 30,
    };

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    this.logger.log(
      `Video metadata prepared: totalScenes=${scenes.length}, totalDuration=${totalDuration}s`,
    );

    return output;
  }
}

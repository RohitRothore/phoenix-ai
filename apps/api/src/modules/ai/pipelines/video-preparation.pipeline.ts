import { ConflictException, Injectable } from '@nestjs/common';
import { Pipeline } from '@phoenix/ai-core';

import { RenderPrompt } from '../agents/prompt/prompt.types';
import { SceneItem } from '../agents/scene/scene.types';
import { VideoAgent } from '../agents/video/video.agent';
import { VideoOutput } from '../agents/video/video.types';

export interface VideoPreparationInput {
  project: {
    topic: string;
    language: string;
    platform: string;
    style: string;
    humor: string;
  };
  scenes: SceneItem[];
  prompts: RenderPrompt[];
}

@Injectable()
export class VideoPreparationPipeline
  implements Pipeline<VideoPreparationInput, VideoOutput>
{
  constructor(private readonly videoAgent: VideoAgent) {}

  async run(input: VideoPreparationInput): Promise<VideoOutput> {
    const promptsByScene = new Map(input.prompts.map((prompt) => [prompt.id, prompt]));

    if (promptsByScene.size !== input.scenes.length) {
      throw new ConflictException('Render prompts must contain exactly one prompt for every scene.');
    }

    const scenes = input.scenes.map((scene) => {
      const prompt = promptsByScene.get(scene.id);
      if (!prompt) {
        throw new ConflictException(`Render prompt is missing for scene ${scene.id}.`);
      }

      return {
        ...scene,
        prompt: prompt.prompt,
        negativePrompt: prompt.negativePrompt,
        camera: prompt.camera,
        lighting: prompt.lighting,
        mood: prompt.mood,
      };
    });

    return this.videoAgent.execute({ ...input, scenes });
  }
}

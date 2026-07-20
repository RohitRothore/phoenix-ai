import { ConflictException } from '@nestjs/common';

import { VideoAgent } from '../agents/video/video.agent';
import { VideoPreparationPipeline } from './video-preparation.pipeline';

describe('VideoPreparationPipeline', () => {
  const input = {
    project: { topic: 'Pappu IT Office', language: 'Hindi', platform: 'YouTube Shorts', style: 'Pixar', humor: 'Sarcastic' },
    scenes: [{ id: 1, title: 'Intro', act: 'Setup', duration: 8, description: 'Pappu sleeps.', dialogue: '', visualPrompt: 'Office scene', comedyElement: 'Snores' }],
    prompts: [{ id: 1, prompt: 'Animated office scene', negativePrompt: 'No text', camera: 'Medium shot', lighting: 'Warm', mood: 'Playful' }],
  };

  it('combines each scene with its validated render prompt', async () => {
    const pipeline = new VideoPreparationPipeline(new VideoAgent());

    const result = await pipeline.run(input);

    expect(result.status).toBe('pending');
    expect(result.scenes[0]).toEqual(expect.objectContaining({ id: 1, prompt: 'Animated office scene', scenePath: 'video/scene-001.mp4' }));
  });

  it('rejects a plan with a missing prompt', async () => {
    const pipeline = new VideoPreparationPipeline(new VideoAgent());

    await expect(pipeline.run({ ...input, prompts: [] })).rejects.toBeInstanceOf(ConflictException);
  });
});

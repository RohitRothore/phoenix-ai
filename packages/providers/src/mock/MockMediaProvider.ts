import { MediaProvider, GenerateAudioRequest, GenerateAudioResponse, GenerateVideoRequest, GenerateVideoResponse } from '@phoenix/ai-core';

export class MockMediaProvider implements MediaProvider {
  readonly provider = 'mock-media';
  readonly model = 'mock-v1';

  async generateAudio(request: GenerateAudioRequest): Promise<GenerateAudioResponse> {
    // Simulate audio generation
    const audioPath = `audio/${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    const duration = request.text.length * 0.1; // Rough estimate: ~0.1 seconds per character

    return {
      audioPath,
      duration,
      provider: this.provider,
      model: this.model,
    };
  }

  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    // Simulate video generation
    const videoPath = `video/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
    const duration = request.duration || 5;

    return {
      videoPath,
      duration,
      provider: this.provider,
      model: this.model,
      metadata: {
        prompt: request.prompt,
        resolution: request.resolution || '1920x1080',
        frameRate: request.frameRate || 30,
      },
    };
  }
}
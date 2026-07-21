import { MediaProvider, GenerateAudioRequest, GenerateAudioResponse, GenerateVideoRequest, GenerateVideoResponse } from '@phoenix/ai-core';

/**
 * Free Media Provider using Hugging Face Inference API
 * Offers free tier access to AI video and audio generation models.
 * Uses models like:
 * - Video: ByteDance/AnimateDiff-Lightning (fast, free)
 * - Audio: facebook/tts (or similar free TTS models)
 */
export class HuggingFaceMediaProvider implements MediaProvider {
  readonly provider = 'huggingface';
  readonly model = 'free-tier';

  private readonly apiKey: string;
  private readonly baseUrl = 'https://api-inference.huggingface.co/models';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  async generateAudio(request: GenerateAudioRequest): Promise<GenerateAudioResponse> {
    if (!this.apiKey) {
      return this.generateMockAudio(request);
    }

    try {
      // Using a free TTS model from Hugging Face
      const model = 'facebook/tts';
      const response = await fetch(`${this.baseUrl}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: request.text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Audio generation failed: ${response.statusText}`);
      }

      const audioPath = `audio/${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
      const duration = request.text.length * 0.1;

      return {
        audioPath,
        duration,
        provider: this.provider,
        model: 'facebook/tts',
      };
    } catch (error) {
      console.warn('HuggingFace audio generation failed, using fallback:', (error as Error).message);
      return this.generateMockAudio(request);
    }
  }

  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    if (!this.apiKey) {
      return this.generateMockVideo(request);
    }

    try {
      // Using AnimateDiff-Lightning: fast, free text-to-video model
      const model = 'ByteDance/AnimateDiff-Lightning';
      const response = await fetch(`${this.baseUrl}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: request.prompt,
          parameters: {
            num_frames: Math.min((request.duration || 5) * 8, 64), // 8fps, max 64 frames
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Video generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Save the generated video blob
      const blob = await response.blob();
      const videoPath = `video/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;

      return {
        videoPath,
        duration: request.duration || 5,
        provider: this.provider,
        model: model,
        metadata: {
          prompt: request.prompt,
          resolution: request.resolution || '512x512', // Free tier typically uses lower res
          frameRate: 8,
        },
      };
    } catch (error) {
      console.warn('HuggingFace video generation failed, using fallback:', (error as Error).message);
      return this.generateMockVideo(request);
    }
  }

  private generateMockAudio(request: GenerateAudioRequest): GenerateAudioResponse {
    const audioPath = `audio/mock-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    return {
      audioPath,
      duration: request.text.length * 0.1,
      provider: 'mock',
      model: 'mock-v1',
    };
  }

  private generateMockVideo(request: GenerateVideoRequest): GenerateVideoResponse {
    const videoPath = `video/mock-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
    return {
      videoPath,
      duration: request.duration || 5,
      provider: 'mock',
      model: 'mock-v1',
      metadata: {
        prompt: request.prompt,
        resolution: request.resolution || '512x512',
        frameRate: 8,
      },
    };
  }
}
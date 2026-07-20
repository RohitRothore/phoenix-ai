export interface GenerateAudioRequest {
  text: string;
  voice?: string;
  language?: string;
  emotion?: string;
}

export interface GenerateAudioResponse {
  audioPath: string;
  duration: number;
  provider: string;
  model: string;
}

export interface GenerateVideoRequest {
  prompt: string;
  negativePrompt?: string;
  duration: number;
  resolution?: string;
  frameRate?: number;
  style?: string;
}

export interface GenerateVideoResponse {
  videoPath: string;
  duration: number;
  provider: string;
  model: string;
  metadata?: Record<string, unknown>;
}

export interface MediaProvider {
  readonly provider: string;
  readonly model: string;

  generateAudio(
    request: GenerateAudioRequest,
  ): Promise<GenerateAudioResponse>;

  generateVideo(
    request: GenerateVideoRequest,
  ): Promise<GenerateVideoResponse>;
}
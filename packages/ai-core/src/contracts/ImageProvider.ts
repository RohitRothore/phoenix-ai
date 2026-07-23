export interface GenerateImageRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  seed?: number;
  style?: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

export interface GenerateImageResponse {
  imageUrl: string;
  imagePath: string;
  width: number;
  height: number;
  seed?: number;
  provider: string;
  model: string;
  generationTime: number;
  metadata?: Record<string, unknown>;
}

export interface ImageProvider {
  readonly provider: string;
  readonly model: string;

  generateImage(
    request: GenerateImageRequest,
  ): Promise<GenerateImageResponse>;
}

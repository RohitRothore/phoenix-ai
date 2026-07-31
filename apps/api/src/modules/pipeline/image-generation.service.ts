import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';

import { PROVIDER_REGISTRY } from '../provider/provider.module';
import { ProviderRegistry } from '@phoenix/providers';
import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { GenerationQueueService } from './generation-queue.service';
import { GridFsService } from '../../common/storage/gridfs.service';
import { RenderPrompt } from '../ai/agents/prompt/prompt.types';

export interface ImageGenerationResult {
  sceneId: string;
  assetId: string;
  imageUrl: string;
  imagePath: string;
  provider: string;
  model: string;
  generationTime: number;
  width: number;
  height: number;
  seed?: number;
}

export interface ImageGenerationInput {
  projectId: string;
  projectSlug: string;
  scenes: Array<{
    id: string;
    duration: number;
    prompt: RenderPrompt;
  }>;
}

@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);

  private static readonly MAX_CONCURRENT_IMAGES = 3;
  private static readonly IMAGE_WIDTH = 1080;
  private static readonly IMAGE_HEIGHT = 1920;

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
    private readonly assetService: AssetService,
    private readonly pipelineState: PipelineStateService,
    private readonly queueService: GenerationQueueService,
    private readonly gridfs: GridFsService,
  ) {}

  async generateImages(
    input: ImageGenerationInput,
  ): Promise<ImageGenerationResult[]> {
    const { projectId, projectSlug, scenes } = input;

    await this.pipelineState.setStatus(
      projectId,
      'image-generation',
      'running',
    );
    await this.pipelineState.addLog(projectId, 'image-generation', {
      timestamp: new Date(),
      level: 'info',
      message: `Starting image generation for ${scenes.length} scenes`,
    });

    // Sort scenes by ID to ensure deterministic ordering
    const sortedScenes = [...scenes].sort((a, b) =>
      Number(a.id) < Number(b.id) ? -1 : Number(a.id) > Number(b.id) ? 1 : 0,
    );

    // Process scenes in parallel with a concurrency limit
    const results: ImageGenerationResult[] = [];
    const errors: Array<{ sceneId: string; error: Error }> = [];

    const batches: Array<typeof sortedScenes> = [];
    for (
      let i = 0;
      i < sortedScenes.length;
      i += ImageGenerationService.MAX_CONCURRENT_IMAGES
    ) {
      batches.push(
        sortedScenes.slice(i, i + ImageGenerationService.MAX_CONCURRENT_IMAGES),
      );
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map((scene) =>
          this.generateImageForScene(projectId, projectSlug, scene),
        ),
      );

      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i];
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        } else if (result.status === 'rejected') {
          const sceneId = batch[i].id;
          const error = result.reason as Error;
          errors.push({ sceneId, error });
          this.logger.error(
            `Failed to generate image for scene ${sceneId}: ${error.message}`,
          );
          await this.pipelineState.addLog(projectId, 'image-generation', {
            timestamp: new Date(),
            level: 'error',
            message: `Failed to generate image for scene ${sceneId}: ${error.message}`,
          });
        }
      }
    }

    if (errors.length > 0) {
      await this.pipelineState.setStatus(
        projectId,
        'image-generation',
        'failed',
      );
      throw errors[0].error;
    }

    // Sort results by scene ID to maintain order
    results.sort((a, b) =>
      Number(a.sceneId) < Number(b.sceneId)
        ? -1
        : Number(a.sceneId) > Number(b.sceneId)
          ? 1
          : 0,
    );

    await this.pipelineState.setStatus(
      projectId,
      'image-generation',
      'completed',
    );
    await this.pipelineState.addLog(projectId, 'image-generation', {
      timestamp: new Date(),
      level: 'info',
      message: `Image generation completed for ${results.length} scenes`,
    });

    return results;
  }

  private async generateImageForScene(
    projectId: string,
    projectSlug: string,
    scene: {
      id: string;
      duration: number;
      prompt: RenderPrompt;
    },
  ): Promise<ImageGenerationResult> {
    await this.pipelineState.addLog(projectId, 'image-generation', {
      timestamp: new Date(),
      level: 'info',
      message: `Generating image for scene ${scene.id}`,
    });

    const job = await this.queueService.enqueue({
      projectId,
      sceneId: scene.id,
      type: 'image',
      provider: 'mock-image',
      request: { prompt: scene.prompt.prompt },
    });

    await this.queueService.setStatus(job._id?.toString() ?? '', 'running');

    const imageProvider = this.registry.getImageProvider();
    if (!imageProvider) {
      throw new InternalServerErrorException('No image provider registered.');
    }

    const response = await imageProvider.generateImage({
      prompt: scene.prompt.prompt,
      negativePrompt: scene.prompt.negativePrompt,
      width: ImageGenerationService.IMAGE_WIDTH,
      height: ImageGenerationService.IMAGE_HEIGHT,
      style: scene.prompt.mood,
    });

    const existing = await this.assetService.findByProjectAndScene(
      projectId,
      scene.id,
      'IMAGE',
    );
    if (existing) {
      const oldGridfsId = existing.path?.replace('gridfs:', '') ?? '';
      if (oldGridfsId) {
        await this.gridfs.deleteFile(oldGridfsId).catch(() => {});
      }
      await this.assetService.delete(existing._id?.toString() ?? '');
    }

    let imageBuffer: Buffer | null = null;

    if (response.imageUrl.startsWith('http')) {
      try {
        const res = await fetch(response.imageUrl);
        if (res.ok) {
          imageBuffer = Buffer.from(await res.arrayBuffer());
        }
      } catch (e) {
        this.logger.warn(`Failed to download image: ${(e as Error).message}`);
      }
    } else if (response.imageUrl.startsWith('data:image')) {
      try {
        const base64Data = response.imageUrl.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } catch (e) {
        this.logger.warn(
          `Failed to persist generated image: ${(e as Error).message}`,
        );
      }
    }

    if (!imageBuffer) {
      throw new InternalServerErrorException(
        `Image generation did not return a usable image for scene ${scene.id}. Retry that scene instead of rendering a placeholder.`,
      );
    }

    const gridfsFilename = `${projectSlug}/images/scene-${scene.id}.png`;
    const gridfsId = await this.gridfs.uploadFile(gridfsFilename, imageBuffer, {
      projectId,
      sceneId: scene.id,
      provider: response.provider,
      model: response.model,
    });

    const imagePath = `gridfs:${gridfsId}`;

    const asset = await this.assetService.create({
      projectId,
      sceneId: scene.id,
      type: 'IMAGE',
      filename: response.imagePath,
      path: imagePath,
      url: response.imageUrl,
      width: response.width,
      height: response.height,
      seed: response.seed,
      provider: response.provider,
      model: response.model,
      generationTime: response.generationTime,
      metadata: {
        prompt: scene.prompt.prompt,
        negativePrompt: scene.prompt.negativePrompt,
        camera: scene.prompt.camera,
        lighting: scene.prompt.lighting,
        mood: scene.prompt.mood,
        gridfsId,
      },
    });

    await this.assetService.update(asset._id?.toString() ?? '', {
      status: 'ready',
    });
    await this.queueService.setStatus(job._id?.toString() ?? '', 'completed');
    await this.queueService.setResponse(job._id?.toString() ?? '', {
      assetId: asset._id?.toString() ?? '',
      ...response,
    });

    await this.pipelineState.addLog(projectId, 'image-generation', {
      timestamp: new Date(),
      level: 'info',
      message: `Image generated for scene ${scene.id} using ${response.provider}`,
    });

    return {
      sceneId: scene.id,
      assetId: asset._id?.toString() ?? '',
      imageUrl: response.imageUrl,
      imagePath,
      provider: response.provider,
      model: response.model,
      generationTime: response.generationTime,
      width: response.width,
      height: response.height,
      seed: response.seed,
    };
  }

  async regenerateImage(
    projectId: string,
    projectSlug: string,
    sceneId: string,
    prompt: RenderPrompt,
  ): Promise<ImageGenerationResult> {
    const existing = await this.assetService.findByProjectAndScene(
      projectId,
      sceneId,
      'IMAGE',
    );
    if (existing) {
      const oldGridfsId = existing.path?.replace('gridfs:', '') ?? '';
      if (oldGridfsId) {
        await this.gridfs.deleteFile(oldGridfsId).catch(() => {});
      }
      await this.assetService.delete(existing._id?.toString() ?? '');
    }

    const results = await this.generateImages({
      projectId,
      projectSlug,
      scenes: [{ id: sceneId, duration: 5, prompt }],
    });

    return results[0];
  }
}

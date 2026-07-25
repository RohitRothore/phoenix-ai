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
import { FfmpegProcessService } from '../../common/rendering/ffmpeg-process.service';
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

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
    private readonly assetService: AssetService,
    private readonly pipelineState: PipelineStateService,
    private readonly queueService: GenerationQueueService,
    private readonly gridfs: GridFsService,
    private readonly ffmpeg: FfmpegProcessService,
  ) {}

  async generateImages(
    input: ImageGenerationInput,
  ): Promise<ImageGenerationResult[]> {
    const { projectId, projectSlug, scenes } = input;
    const results: ImageGenerationResult[] = [];

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

    for (const scene of scenes) {
      try {
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
          throw new InternalServerErrorException(
            'No image provider registered.',
          );
        }

        const response = await imageProvider.generateImage({
          prompt: scene.prompt.prompt,
          negativePrompt: scene.prompt.negativePrompt,
          width: 1024,
          height: 1024,
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
            this.logger.warn(
              `Failed to download image: ${(e as Error).message}`,
            );
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
          imageBuffer = await this.generatePlaceholderImageBuffer(scene.prompt);
        }

        const gridfsFilename = `${projectSlug}/images/scene-${scene.id}.png`;
        const gridfsId = await this.gridfs.uploadFile(
          gridfsFilename,
          imageBuffer,
          {
            projectId,
            sceneId: scene.id,
            provider: response.provider,
            model: response.model,
          },
        );

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
        await this.queueService.setStatus(
          job._id?.toString() ?? '',
          'completed',
        );
        await this.queueService.setResponse(job._id?.toString() ?? '', {
          assetId: asset._id?.toString() ?? '',
          ...response,
        });

        results.push({
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
        });

        await this.pipelineState.addLog(projectId, 'image-generation', {
          timestamp: new Date(),
          level: 'info',
          message: `Image generated for scene ${scene.id} using ${response.provider}`,
        });
      } catch (e) {
        const error = e as Error;
        this.logger.error(
          `Failed to generate image for scene ${scene.id}: ${error.message}`,
        );
        await this.pipelineState.addLog(projectId, 'image-generation', {
          timestamp: new Date(),
          level: 'error',
          message: `Failed to generate image for scene ${scene.id}: ${error.message}`,
        });
        await this.pipelineState.setStatus(
          projectId,
          'image-generation',
          'failed',
        );
        throw e;
      }
    }

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

  private async generatePlaceholderImageBuffer(
    prompt: RenderPrompt,
  ): Promise<Buffer> {
    const tempPath = `/tmp/phoenix-placeholder-${Date.now()}.png`;

    await this.ffmpeg.run(
      [
        '-y',
        '-f',
        'lavfi',
        '-i',
        `color=c=7c3aed:s=1024x1024:d=1`,
        '-frames:v',
        '1',
        tempPath,
      ],
      'generate placeholder image',
    );

    const fs = await import('fs/promises');
    const buffer = await fs.readFile(tempPath);
    await fs.unlink(tempPath).catch(() => {});
    return buffer;
  }
}

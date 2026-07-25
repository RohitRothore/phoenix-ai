import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { MongoDBProjectService } from '../../common/storage/mongodb-project.service';
import { LocalFfmpegVideoRendererService } from '../../common/rendering/local-ffmpeg-video-renderer.service';
import { LocalFfmpegExportService } from '../../common/rendering/local-ffmpeg-export.service';
import { DialogueAgent } from '../ai/agents/dialogue/dialogue.agent';
import { DialogueOutput } from '../ai/agents/dialogue/dialogue.types';
import { PromptAgent } from '../ai/agents/prompt/prompt.agent';
import { PromptOutput, RenderPrompt } from '../ai/agents/prompt/prompt.types';
import { VideoOutput } from '../ai/agents/video/video.types';
import { VideoPreparationPipeline } from '../ai/pipelines/video-preparation.pipeline';
import {
  SubtitleOutput,
  SubtitlePipeline,
} from '../ai/pipelines/subtitle.pipeline';
import { DirectorAgent } from '../ai/agents/director/director.agent';
import { DirectorOutput } from '../ai/agents/director/director.types';
import { SceneAgent } from '../ai/agents/scene/scene.agent';
import { SceneOutput } from '../ai/agents/scene/scene.types';
import { StoryAgent } from '../ai/agents/story/story.agent';
import { StoryOutput } from '../ai/agents/story/story.types';
import { VoiceAgent } from '../ai/agents/voice/voice.agent';
import { VoiceOutput } from '../ai/agents/voice/voice.types';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ArtifactStatus,
  Asset,
  AssetDocument,
  PipelineStateDocument,
  GenerationJobDocument,
  ExportDocument,
} from '../../common/storage/schemas';
import { LocalStorageService } from '../../common/storage/local-storage.service';
import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from '../pipeline/pipeline-state.service';
import { GenerationQueueService } from '../pipeline/generation-queue.service';
import {
  ImageGenerationService,
  ImageGenerationResult,
} from '../pipeline/image-generation.service';
import { PromptEnhancerService } from '../pipeline/prompt-enhancer.service';
import { SceneRendererService } from '../pipeline/scene-renderer.service';
import { ProjectAssemblerService } from '../pipeline/project-assembler.service';

export interface ProjectJson {
  id: string;
  name: string;
  slug: string;
  language: string;
  platform: string;
  style: string;
  humor: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type DirectorArtifact = DirectorOutput & { status: ArtifactStatus };
type StoryArtifact = StoryOutput & { status: ArtifactStatus };
type SceneArtifact = SceneOutput & { status: ArtifactStatus };
type DialogueArtifact = DialogueOutput & { status: ArtifactStatus };
type PromptArtifact = PromptOutput & { status: ArtifactStatus };
type VideoArtifact = VideoOutput & {
  status: ArtifactStatus;
  renderStatus?: 'completed';
  finalPath?: string;
  renderedAt?: string;
};
type SubtitleArtifact = SubtitleOutput & {
  status: ArtifactStatus;
  srtPath: string;
};
type VoiceArtifact = VoiceOutput & {
  status: ArtifactStatus;
};

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly mongo: MongoDBProjectService,
    private readonly storage: LocalStorageService,
    private readonly directorAgent: DirectorAgent,
    private readonly storyAgent: StoryAgent,
    private readonly sceneAgent: SceneAgent,
    private readonly dialogueAgent: DialogueAgent,
    private readonly promptAgent: PromptAgent,
    private readonly videoPreparationPipeline: VideoPreparationPipeline,
    private readonly localVideoRenderer: LocalFfmpegVideoRendererService,
    private readonly subtitlePipeline: SubtitlePipeline,
    private readonly localExportService: LocalFfmpegExportService,
    private readonly voiceAgent: VoiceAgent,
    private readonly imageGenerationService: ImageGenerationService,
    private readonly promptEnhancerService: PromptEnhancerService,
    private readonly sceneRendererService: SceneRendererService,
    private readonly assetService: AssetService,
    private readonly pipelineStateService: PipelineStateService,
    private readonly generationQueueService: GenerationQueueService,
    private readonly projectAssemblerService: ProjectAssemblerService,
  ) {}

  async create(
    dto: CreateProjectDto,
  ): Promise<{ success: boolean; message: string; data: ProjectJson }> {
    const baseSlug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await this.mongo.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const projectId = randomUUID();
    const now = new Date().toISOString();

    const projectPayload: ProjectJson = {
      id: projectId,
      name: dto.name,
      slug,
      language: dto.language,
      platform: dto.platform,
      style: dto.style,
      humor: dto.humor ?? 'light',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    try {
      const createdProject = await this.mongo.createProject(projectPayload);

      await this.mongo.setArtifact(createdProject.id!, 'director', {
        status: 'pending',
      });
      await this.mongo.setArtifact(createdProject.id!, 'story', {
        status: 'pending',
      });
      await this.mongo.setArtifact(createdProject.id!, 'scenes', {
        status: 'pending',
      });
      await this.mongo.setArtifact(createdProject.id!, 'dialogues', {
        status: 'pending',
      });
      await this.mongo.setArtifact(createdProject.id!, 'prompts', {
        status: 'pending',
      });
      await this.mongo.setArtifact(createdProject.id!, 'video', {
        status: 'pending',
      });
      await this.mongo.setArtifact(createdProject.id!, 'subtitles', {
        status: 'pending',
      });
      await this.mongo.setArtifact(createdProject.id!, 'voice', {
        status: 'pending',
      });

      this.logger.log(`Project created: slug="${slug}", id="${projectId}"`);

      return {
        success: true,
        message: 'Project created successfully.',
        data: projectPayload,
      };
    } catch (error: unknown) {
      const err = error as {
        code?: number;
        keyPattern?: { slug?: boolean };
        keyValue?: { slug?: string };
      };
      if (err.code === 11000) {
        const dupKey = err.keyPattern?.slug
          ? `"${err.keyValue?.slug}"`
          : 'a project with this name';
        throw new ConflictException(
          `Project with slug ${dupKey} already exists. Please use a different name.`,
        );
      }
      throw error;
    }
  }

  async findOne(slug: string) {
    const project = await this.mongo.findBySlug(slug);

    if (!project) {
      throw new NotFoundException(`Project "${slug}" not found.`);
    }

    return {
      success: true,
      message: 'Project retrieved successfully.',
      data: project,
    };
  }

  async getDirectorPlan(slug: string) {
    const project = await this.mongo.findBySlug(slug);
    if (!project) {
      throw new NotFoundException(`Project "${slug}" not found.`);
    }
    const data = await this.mongo.getArtifact<Record<string, unknown>>(
      project.id!,
      'director',
    );
    return {
      success: true,
      message: 'Director plan retrieved successfully.',
      data,
    };
  }

  async getStory(slug: string) {
    const project = await this.mongo.findBySlug(slug);
    if (!project) {
      throw new NotFoundException(`Project "${slug}" not found.`);
    }
    const data = await this.mongo.getArtifact<Record<string, unknown>>(
      project.id!,
      'story',
    );
    return {
      success: true,
      message: 'Story retrieved successfully.',
      data,
    };
  }

  async getScenes(slug: string) {
    const project = await this.mongo.findBySlug(slug);
    if (!project) {
      throw new NotFoundException(`Project "${slug}" not found.`);
    }
    const data = await this.mongo.getArtifact<Record<string, unknown>>(
      project.id!,
      'scenes',
    );
    return {
      success: true,
      message: 'Scenes retrieved successfully.',
      data,
    };
  }

  async list() {
    const projects = await this.mongo.listProjects();

    return {
      success: true,
      message: 'Projects retrieved successfully.',
      data: projects,
    };
  }

  async generateDirectorPlan(slug: string) {
    const project = await this.loadProject(slug);

    this.logger.log(`Generating director plan for project: "${slug}"`);

    const directorOutput = await this.directorAgent.execute({
      topic: project.name,
      language: project.language,
      platform: project.platform,
      style: project.style,
      humor: project.humor,
    });

    const payload = { ...directorOutput, status: 'ready' as const };

    await this.mongo.setArtifact(project.id, 'director', payload);
    await this.updateProjectTimestamp(slug);

    this.logger.log(`Director plan saved for project: "${slug}"`);

    return {
      success: true,
      message: 'Director plan generated successfully.',
      data: payload,
    };
  }

  async generateStory(slug: string) {
    const project = await this.loadProject(slug);

    const directorRaw = (await this.mongo.getArtifact(
      project.id,
      'director',
    )) as DirectorArtifact | null;

    if (!directorRaw || directorRaw.status !== 'ready') {
      throw new ConflictException(
        'Director please is not ready, please generate director plan',
      );
    }

    this.logger.log(`Generating story for project: "${slug}"`);

    const storyOutput = await this.storyAgent.execute({
      project: {
        topic: project.name,
        language: project.language,
        platform: project.platform,
        style: project.style,
        humor: project.humor,
      },
      directorPlan: directorRaw as DirectorOutput,
    });

    const payload = { ...storyOutput, status: 'ready' as const };

    await this.mongo.setArtifact(project.id, 'story', payload);
    await this.updateProjectTimestamp(slug);

    this.logger.log(`Story saved for project: "${slug}"`);

    return {
      success: true,
      message: 'Story generated successfully.',
      data: payload,
    };
  }

  async generateScenes(slug: string) {
    const project = await this.loadProject(slug);

    const directorRaw = (await this.mongo.getArtifact(
      project.id,
      'director',
    )) as DirectorArtifact | null;
    const storyRaw = (await this.mongo.getArtifact(
      project.id,
      'story',
    )) as StoryArtifact | null;

    if (!storyRaw || storyRaw.status !== 'ready') {
      throw new Error(
        'Story must be generated before scenes. Call /story first.',
      );
    }

    this.logger.log(`Generating scenes for project: "${slug}"`);

    const sceneOutput = await this.sceneAgent.execute({
      project: {
        topic: project.name,
        language: project.language,
        platform: project.platform,
        style: project.style,
      },
      directorPlan: directorRaw as DirectorOutput,
      story: storyRaw as StoryOutput,
    });

    const payload = { ...sceneOutput, status: 'ready' as const };

    await this.mongo.setArtifact(project.id, 'scenes', payload);
    await this.updateProjectTimestamp(slug);

    this.logger.log(
      `Scenes saved for project: "${slug}", count=${sceneOutput.scenes.length}`,
    );

    return {
      success: true,
      message: 'Scenes generated successfully.',
      data: payload,
    };
  }

  async getDialogues(slug: string) {
    const project = await this.loadProject(slug);
    const data = await this.mongo.getArtifact<Record<string, unknown>>(
      project.id,
      'dialogues',
    );
    return {
      success: true,
      message: 'Dialogues retrieved successfully.',
      data,
    };
  }

  async generateDialogues(slug: string) {
    const project = await this.loadProject(slug);

    const directorRaw = (await this.mongo.getArtifact(
      project.id,
      'director',
    )) as DirectorArtifact | null;
    const storyRaw = (await this.mongo.getArtifact(
      project.id,
      'story',
    )) as StoryArtifact | null;
    const scenesRaw = (await this.mongo.getArtifact(
      project.id,
      'scenes',
    )) as SceneArtifact | null;

    if (!scenesRaw || scenesRaw.status !== 'ready') {
      throw new Error(
        'Scenes must be generated before dialogues. Call /scenes first.',
      );
    }

    this.logger.log(`Generating dialogues for project: "${slug}"`);

    const dialogueOutput = await this.dialogueAgent.execute({
      project: {
        topic: project.name,
        language: project.language,
        platform: project.platform,
        style: project.style,
      },
      directorPlan: directorRaw as DirectorOutput,
      story: storyRaw as StoryOutput,
      scenes: scenesRaw.scenes,
    });

    const payload = { ...dialogueOutput, status: 'ready' as const };

    await this.mongo.setArtifact(project.id, 'dialogues', payload);
    await this.updateProjectTimestamp(slug);

    this.logger.log(
      `Dialogues saved for project: "${slug}", scenes=${dialogueOutput.scenes.length}`,
    );

    return {
      success: true,
      message: 'Dialogues generated successfully.',
      data: payload,
    };
  }

  async getPrompts(slug: string) {
    const project = await this.loadProject(slug);
    const data = await this.mongo.getArtifact<Record<string, unknown>>(
      project.id,
      'prompts',
    );
    if (!data) {
      return {
        success: true,
        message: 'Render prompts retrieved successfully.',
        data: { status: 'pending' as const },
      };
    }
    return {
      success: true,
      message: 'Render prompts retrieved successfully.',
      data,
    };
  }

  async generatePrompts(slug: string) {
    const project = await this.loadProject(slug);
    const directorRaw = (await this.mongo.getArtifact(
      project.id,
      'director',
    )) as DirectorArtifact | null;
    const scenes = (await this.mongo.getArtifact(
      project.id,
      'scenes',
    )) as SceneArtifact | null;
    const dialogues = (await this.mongo.getArtifact(
      project.id,
      'dialogues',
    )) as DialogueArtifact | null;

    if (
      !directorRaw ||
      directorRaw.status !== 'ready' ||
      !scenes ||
      scenes.status !== 'ready' ||
      !dialogues ||
      dialogues.status !== 'ready'
    ) {
      throw new ConflictException(
        'Director plan, scenes, and dialogues must be generated before render prompts.',
      );
    }

    this.logger.log(`Generating render prompts for project: "${slug}"`);
    const output = await this.promptAgent.execute({
      project: {
        language: project.language,
        platform: project.platform,
        style: project.style,
      },
      directorPlan: directorRaw,
      scenes: scenes.scenes,
      dialogues: dialogues.scenes,
    });

    const payload = { ...output, status: 'ready' as const };
    await this.mongo.setArtifact(project.id, 'prompts', payload);
    await this.updateProjectTimestamp(slug);

    this.logger.log(
      `Render prompts saved for project: "${slug}", scenes=${output.scenes.length}`,
    );

    return {
      success: true,
      message: 'Render prompts generated successfully.',
      data: payload,
    };
  }

  async getVideoPlan(slug: string) {
    const project = await this.loadProject(slug);
    const data = await this.mongo.getArtifact<Record<string, unknown>>(
      project.id,
      'video',
    );
    if (!data) {
      return {
        success: true,
        message: 'Video render plan retrieved successfully.',
        data: { status: 'pending' as const },
      };
    }
    return {
      success: true,
      message: 'Video render plan retrieved successfully.',
      data,
    };
  }

  async prepareVideo(slug: string) {
    const project = await this.loadProject(slug);
    const scenes = (await this.mongo.getArtifact(
      project.id,
      'scenes',
    )) as SceneArtifact | null;
    const prompts = (await this.mongo.getArtifact(
      project.id,
      'prompts',
    )) as PromptArtifact | null;

    if (
      !scenes ||
      scenes.status !== 'ready' ||
      !prompts ||
      prompts.status !== 'ready'
    ) {
      throw new ConflictException(
        'Scenes and render prompts must be generated before video preparation.',
      );
    }

    const output = await this.videoPreparationPipeline.run({
      project: {
        topic: project.name,
        language: project.language,
        platform: project.platform,
        style: project.style,
        humor: project.humor,
      },
      scenes: scenes.scenes,
      prompts: prompts.scenes,
    });
    const payload = { ...output, status: 'ready' as const };

    await this.mongo.setArtifact(project.id, 'video', payload);
    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: 'Video render plan prepared successfully.',
      data: payload,
    };
  }

  async renderVideo(slug: string) {
    const project = await this.loadProject(slug);
    const video = (await this.mongo.getArtifact(
      project.id,
      'video',
    )) as VideoArtifact | null;

    if (
      !video ||
      video.status !== 'ready' ||
      !video.scenes ||
      video.scenes.length === 0
    ) {
      throw new ConflictException(
        'A video render plan must be prepared before rendering.',
      );
    }

    const renderedVideo = await this.localVideoRenderer.render(
      slug,
      video.scenes.map((scene) => ({
        id: scene.id,
        duration: scene.duration,
        prompt: scene.prompt,
        mood: scene.mood,
        scenePath: scene.scenePath,
        status: scene.status,
      })),
    );
    const payload: VideoArtifact = {
      ...video,
      scenes: video.scenes.map((scene) => ({ ...scene, status: 'ready' })),
      renderStatus: 'completed',
      finalPath: renderedVideo.finalPath,
      renderedAt: renderedVideo.renderedAt,
    };

    await this.mongo.setArtifact(
      project.id,
      'video',
      payload as unknown as Record<string, unknown>,
    );
    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: 'Local fallback video rendered successfully.',
      data: payload,
    };
  }

  async getSubtitles(slug: string) {
    const project = await this.loadProject(slug);
    const data = await this.mongo.getArtifact<Record<string, unknown>>(
      project.id,
      'subtitles',
    );
    if (!data) {
      return {
        success: true,
        message: 'Subtitles retrieved successfully.',
        data: { status: 'pending' as const },
      };
    }
    return {
      success: true,
      message: 'Subtitles retrieved successfully.',
      data,
    };
  }

  async generateSubtitles(slug: string) {
    const project = await this.loadProject(slug);
    const scenes = (await this.mongo.getArtifact(
      project.id,
      'scenes',
    )) as SceneArtifact | null;
    const dialogues = (await this.mongo.getArtifact(
      project.id,
      'dialogues',
    )) as DialogueArtifact | null;

    if (
      !scenes ||
      scenes.status !== 'ready' ||
      !dialogues ||
      dialogues.status !== 'ready'
    ) {
      throw new ConflictException(
        'Scenes and dialogues must be generated before subtitles.',
      );
    }

    const output = await this.subtitlePipeline.run({
      scenes: scenes.scenes,
      dialogues: dialogues.scenes,
    });

    const srtPath = `projects/${slug}/subtitles/captions.srt`;
    await this.mongo.setArtifact(project.id, 'subtitles', {
      ...output,
      srtPath,
      status: 'ready' as const,
    });
    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: 'Subtitles generated successfully.',
      data: { ...output, srtPath, status: 'ready' },
    };
  }

  async getVoice(slug: string) {
    const project = await this.loadProject(slug);
    const data = await this.mongo.getArtifact<Record<string, unknown>>(
      project.id,
      'voice',
    );
    if (!data) {
      return {
        success: true,
        message: 'Voice plan retrieved successfully.',
        data: { status: 'pending' as const },
      };
    }
    return {
      success: true,
      message: 'Voice plan retrieved successfully.',
      data,
    };
  }

  async generateVoice(slug: string) {
    const project = await this.loadProject(slug);

    const dialoguesRaw = (await this.mongo.getArtifact(
      project.id,
      'dialogues',
    )) as DialogueArtifact | null;

    if (!dialoguesRaw || dialoguesRaw.status !== 'ready') {
      throw new ConflictException(
        'Dialogues must be generated before voice. Call /dialogues first.',
      );
    }

    this.logger.log(`Generating voice for project: "${slug}"`);

    const voiceOutput = await this.voiceAgent.execute({
      project: {
        topic: project.name,
        language: project.language,
        platform: project.platform,
        style: project.style,
      },
      dialogues: dialoguesRaw,
    });

    const payload = { ...voiceOutput, status: 'ready' as const };

    await this.mongo.setArtifact(project.id, 'voice', payload);
    await this.updateProjectTimestamp(slug);

    this.logger.log(
      `Voice saved for project: "${slug}", lines=${voiceOutput.scenes.length}`,
    );

    return {
      success: true,
      message: 'Voice generated successfully.',
      data: payload,
    };
  }

  async exportVideo(slug: string) {
    const project = await this.loadProject(slug);
    const video = (await this.mongo.getArtifact(
      project.id,
      'video',
    )) as VideoArtifact | null;
    const subtitles = (await this.mongo.getArtifact(
      project.id,
      'subtitles',
    )) as SubtitleArtifact | null;

    if (
      !video ||
      video.renderStatus !== 'completed' ||
      !video.finalPath ||
      !subtitles ||
      subtitles.status !== 'ready'
    ) {
      throw new ConflictException(
        'Render the video and generate subtitles before exporting.',
      );
    }

    const exportPath = await this.localExportService.export(
      slug,
      video.finalPath,
      subtitles.srtPath,
    );
    return {
      success: true,
      message: 'Captioned video exported successfully.',
      data: { path: exportPath },
    };
  }

  async downloadExport(slug: string) {
    const project = await this.loadProject(slug);
    const video = (await this.mongo.getArtifact(
      project.id,
      'video',
    )) as VideoArtifact | null;

    if (!video || video.renderStatus !== 'completed' || !video.finalPath) {
      throw new ConflictException(
        'Render the video before downloading the final export.',
      );
    }

    const path = `projects/${slug}/${video.finalPath}`;
    const buffer = await this.storage.readBinary(path);
    const filename = `${slug}-final.mp4`;

    return {
      buffer,
      filename,
      contentType: 'video/mp4',
    };
  }

  // ─── Image Generation ─────────────────────────────────────────────────────

  async generateImages(slug: string) {
    const project = await this.loadProject(slug);
    const scenes = (await this.mongo.getArtifact(
      project.id,
      'scenes',
    )) as SceneArtifact | null;
    const prompts = (await this.mongo.getArtifact(
      project.id,
      'prompts',
    )) as PromptArtifact | null;

    if (
      !scenes ||
      scenes.status !== 'ready' ||
      !prompts ||
      prompts.status !== 'ready'
    ) {
      throw new ConflictException(
        'Scenes and render prompts must be generated before image generation.',
      );
    }

    this.logger.log(`Generating images for project: "${slug}"`);

    const enhancedPrompts = this.promptEnhancerService.enhancePrompts(
      prompts.scenes,
    );

    const imageScenes = scenes.scenes.map((scene) => {
      const prompt = enhancedPrompts.find((p) => p.id === scene.id);
      return {
        id: String(scene.id),
        duration: scene.duration,
        prompt: prompt ?? {
          id: scene.id,
          prompt: scene.visualPrompt,
          negativePrompt: '',
          camera: '',
          lighting: '',
          mood: '',
        },
      };
    });

    const results = await this.imageGenerationService.generateImages({
      projectId: project.id!,
      projectSlug: slug,
      scenes: imageScenes,
    });

    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: `Images generated for ${results.length} scenes.`,
      data: results,
    };
  }

  async regenerateImage(slug: string, sceneId: string) {
    const project = await this.loadProject(slug);
    const prompts = (await this.mongo.getArtifact(
      project.id,
      'prompts',
    )) as PromptArtifact | null;

    if (!prompts || prompts.status !== 'ready') {
      throw new ConflictException(
        'Render prompts must be generated before regenerating an image.',
      );
    }

    const prompt = prompts.scenes.find((p) => String(p.id) === sceneId);
    if (!prompt) {
      throw new NotFoundException(`Scene ${sceneId} not found.`);
    }

    this.logger.log(
      `Regenerating image for scene ${sceneId} in project: "${slug}"`,
    );

    const result = await this.imageGenerationService.regenerateImage(
      project.id!,
      slug,
      sceneId,
      prompt,
    );

    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: `Image regenerated for scene ${sceneId}.`,
      data: result,
    };
  }

  async getImages(slug: string) {
    const project = await this.loadProject(slug);
    const assets = await this.assetService.listByProject(project.id!, 'IMAGE');

    const results: ImageGenerationResult[] = assets.map((asset) => ({
      sceneId: asset.sceneId ?? '',
      assetId: asset._id?.toString() ?? '',
      imageUrl: asset.url ?? '',
      imagePath: asset.path ?? '',
      provider: asset.provider ?? 'mock-image',
      model: asset.model ?? 'mock',
      generationTime: asset.generationTime ?? 0,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      seed: asset.seed,
    }));

    return {
      success: true,
      message: `Retrieved ${results.length} image results.`,
      data: results,
    };
  }

  async getAssets(slug: string, type?: string) {
    const project = await this.loadProject(slug);
    const assets = await this.assetService.listByProject(
      project.id!,
      type as 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SUBTITLE' | 'EXPORT' | undefined,
    );
    return {
      success: true,
      message: 'Assets retrieved successfully.',
      data: assets,
    };
  }

  // ─── Scene Rendering ──────────────────────────────────────────────────────

  async renderScene(slug: string, sceneId: string) {
    const project = await this.loadProject(slug);
    const scenes = (await this.mongo.getArtifact(
      project.id,
      'scenes',
    )) as SceneArtifact | null;
    const prompts = (await this.mongo.getArtifact(
      project.id,
      'prompts',
    )) as PromptArtifact | null;
    const assets = await this.assetService.listByProject(project.id!, 'IMAGE');

    if (!scenes || scenes.status !== 'ready') {
      throw new ConflictException('Scenes must be generated before rendering.');
    }

    const scene = scenes.scenes.find((s) => String(s.id) === sceneId);
    if (!scene) {
      throw new NotFoundException(`Scene ${sceneId} not found.`);
    }

    const prompt = prompts?.scenes.find((p) => p.id === scene.id);
    if (!prompt) {
      throw new ConflictException(
        `Render prompt for scene ${sceneId} not found.`,
      );
    }

    const imageAsset = assets.find((a) => a.sceneId === sceneId);
    if (!imageAsset) {
      throw new ConflictException(
        `Image for scene ${sceneId} not found. Generate images first.`,
      );
    }

    this.logger.log(`Rendering scene ${sceneId} in project: "${slug}"`);

    const results = await this.sceneRendererService.renderScenes({
      projectId: project.id!,
      projectSlug: slug,
      scenes: [
        {
          id: sceneId,
          duration: scene.duration,
          imagePath: imageAsset.path!,
          prompt,
        },
      ],
    });

    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: `Scene ${sceneId} rendered successfully.`,
      data: results[0],
    };
  }

  async renderProject(slug: string) {
    const project = await this.loadProject(slug);
    const scenes = (await this.mongo.getArtifact(
      project.id,
      'scenes',
    )) as SceneArtifact | null;
    const prompts = (await this.mongo.getArtifact(
      project.id,
      'prompts',
    )) as PromptArtifact | null;
    const assets = await this.assetService.listByProject(project.id!, 'IMAGE');

    if (!scenes || scenes.status !== 'ready') {
      throw new ConflictException('Scenes must be generated before rendering.');
    }

    if (!prompts || prompts.status !== 'ready') {
      throw new ConflictException(
        'Render prompts must be generated before rendering.',
      );
    }

    if (assets.length === 0) {
      throw new ConflictException(
        'Images must be generated before rendering. Call /images first.',
      );
    }

    this.logger.log(`Rendering all scenes for project: "${slug}"`);

    const renderScenes = scenes.scenes.map((scene) => {
      const prompt = prompts.scenes.find((p) => p.id === scene.id);
      const imageAsset = assets.find((a) => a.sceneId === String(scene.id));
      return {
        id: String(scene.id),
        duration: scene.duration,
        imagePath: imageAsset?.path ?? '',
        prompt: prompt ?? {
          id: scene.id,
          prompt: scene.visualPrompt,
          negativePrompt: '',
          camera: '',
          lighting: '',
          mood: '',
        },
      };
    });

    const results = await this.sceneRendererService.renderScenes({
      projectId: project.id!,
      projectSlug: slug,
      scenes: renderScenes,
    });

    // Assemble the final export
    await this.projectAssemblerService.assembleExport({
      projectId: project.id!,
      projectSlug: slug,
      scenes: results.map((r) => ({
        id: r.sceneId,
        duration: r.duration,
        imagePath: r.videoPath,
      })),
    });

    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: `All scenes rendered. ${results.length} scene videos created.`,
      data: results,
    };
  }

  // ─── Pipeline Status ──────────────────────────────────────────────────────

  async getPipelineStatus(slug: string) {
    const project = await this.loadProject(slug);
    const states = await this.pipelineStateService.findByProject(project.id!);
    const jobs = await this.generationQueueService.listByProject(project.id!);
    const assets = await this.assetService.listByProject(project.id!);

    return {
      success: true,
      message: 'Pipeline status retrieved successfully.',
      data: {
        projectId: project.id,
        projectName: project.name,
        stages: states.map((s) => ({
          stage: s.stage,
          status: s.status,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          failedAt: s.failedAt,
          retryCount: s.retryCount,
          errorMessage: s.errorMessage,
          logs: s.logs,
        })),
        jobs: jobs.map((j) => ({
          sceneId: j.sceneId,
          type: j.type,
          provider: j.provider,
          status: j.status,
          startedAt: j.startedAt,
          completedAt: j.completedAt,
          failedAt: j.failedAt,
          retryCount: j.retryCount,
          errorMessage: j.errorMessage,
          logs: j.logs,
        })),
        assets: assets.map((a) => ({
          sceneId: a.sceneId,
          type: a.type,
          filename: a.filename,
          path: a.path,
          status: a.status,
          provider: a.provider,
          model: a.model,
          width: a.width,
          height: a.height,
          duration: a.duration,
          generationTime: a.generationTime,
          seed: a.seed,
        })),
      },
    };
  }

  async retryStage(slug: string, stage: string) {
    const project = await this.loadProject(slug);
    await this.pipelineStateService.retry(
      project.id!,
      stage as
        | 'director'
        | 'story'
        | 'scenes'
        | 'dialogues'
        | 'prompts'
        | 'image-generation'
        | 'scene-rendering'
        | 'subtitle-generation'
        | 'voice-generation'
        | 'export',
    );

    return {
      success: true,
      message: `Stage "${stage}" has been queued for retry.`,
      data: { projectId: project.id, stage, status: 'pending' },
    };
  }

  async resumePipeline(slug: string, stage: string) {
    const project = await this.loadProject(slug);
    await this.pipelineStateService.resume(
      project.id!,
      stage as
        | 'director'
        | 'story'
        | 'scenes'
        | 'dialogues'
        | 'prompts'
        | 'image-generation'
        | 'scene-rendering'
        | 'subtitle-generation'
        | 'voice-generation'
        | 'export',
    );

    return {
      success: true,
      message: `Pipeline stage "${stage}" has been resumed.`,
      data: { projectId: project.id, stage, status: 'pending' },
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async loadProject(slug: string): Promise<ProjectJson> {
    const project = await this.mongo.findBySlug(slug);
    if (!project) {
      throw new NotFoundException(`Project "${slug}" not found.`);
    }
    const raw = project.toObject ? project.toObject() : project;
    return raw as ProjectJson;
  }

  private async updateProjectTimestamp(slug: string): Promise<void> {
    const project = await this.mongo.findBySlug(slug);
    if (!project) return;
    await this.mongo.updateProject(slug, {
      updatedAt: new Date().toISOString(),
    });
  }
}

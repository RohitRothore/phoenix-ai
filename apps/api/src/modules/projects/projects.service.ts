import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { MongoDBProjectService } from '../../common/storage/mongodb-project.service';
import { DialogueAgent } from '../ai/agents/dialogue/dialogue.agent';
import { DialogueOutput } from '../ai/agents/dialogue/dialogue.types';
import { PromptAgent } from '../ai/agents/prompt/prompt.agent';
import { PromptOutput, RenderPrompt } from '../ai/agents/prompt/prompt.types';
import {
  SubtitleOutput,
  SubtitlePipeline,
  VoiceLineTiming,
  toSrt,
} from '../ai/pipelines/subtitle.pipeline';
import { DirectorAgent } from '../ai/agents/director/director.agent';
import { DirectorOutput } from '../ai/agents/director/director.types';
import { SceneAgent } from '../ai/agents/scene/scene.agent';
import { SceneOutput } from '../ai/agents/scene/scene.types';
import { StoryAgent } from '../ai/agents/story/story.agent';
import { StoryOutput } from '../ai/agents/story/story.types';
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
import { GridFsService } from '../../common/storage/gridfs.service';
import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from '../pipeline/pipeline-state.service';
import { GenerationQueueService } from '../pipeline/generation-queue.service';
import {
  ImageGenerationService,
  ImageGenerationResult,
} from '../pipeline/image-generation.service';
import { PromptEnhancerService } from '../pipeline/prompt-enhancer.service';
import { SceneRendererService } from '../pipeline/scene-renderer.service';
import { VoiceGenerationService } from '../pipeline/voice-generation.service';
import { CompositionService } from '../pipeline/composition.service';

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
type SubtitleArtifact = SubtitleOutput & {
  status: ArtifactStatus;
  srtContent: string;
  finalPath?: string;
  composedAt?: string;
};
type VoiceArtifact = {
  lines: Array<{
    sceneId: string;
    character: string;
    text: string;
    emotion: string;
    audioAssetId: string;
    duration: number;
    status: string;
  }>;
  totalDuration: number;
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
    private readonly subtitlePipeline: SubtitlePipeline,
    private readonly imageGenerationService: ImageGenerationService,
    private readonly promptEnhancerService: PromptEnhancerService,
    private readonly sceneRendererService: SceneRendererService,
    private readonly voiceGenerationService: VoiceGenerationService,
    private readonly compositionService: CompositionService,
    private readonly assetService: AssetService,
    private readonly pipelineStateService: PipelineStateService,
    private readonly generationQueueService: GenerationQueueService,
    private readonly gridfs: GridFsService,
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

  async list() {
    const projects = await this.mongo.listProjects();

    return {
      success: true,
      message: 'Projects retrieved successfully.',
      data: projects,
    };
  }

  // ─── Step 1: Director Plan ────────────────────────────────────────────────

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

  // ─── Step 2: Story ───────────────────────────────────────────────────────

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

  async generateStory(slug: string) {
    const project = await this.loadProject(slug);

    const directorRaw = await this.mongo.getArtifact<DirectorOutput>(
      project.id,
      'director',
    );

    if (!directorRaw || directorRaw.status !== 'ready') {
      throw new ConflictException(
        'Director plan is not ready, please generate director plan first.',
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
      directorPlan: directorRaw,
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

  // ─── Step 3: Scenes ──────────────────────────────────────────────────────

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

  async generateScenes(slug: string) {
    const project = await this.loadProject(slug);

    const directorRaw = await this.mongo.getArtifact<DirectorOutput>(
      project.id,
      'director',
    );
    const storyRaw = await this.mongo.getArtifact<StoryOutput>(
      project.id,
      'story',
    );

    if (!directorRaw || directorRaw.status !== 'ready') {
      throw new Error('Director plan must be generated before scenes.');
    }

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
      directorPlan: directorRaw,
      story: storyRaw,
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

  // ─── Step 4: Dialogues ───────────────────────────────────────────────────

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

    const directorRaw = await this.mongo.getArtifact<DirectorOutput>(
      project.id,
      'director',
    );
    const storyRaw = await this.mongo.getArtifact<StoryOutput>(
      project.id,
      'story',
    );
    const scenesRaw = await this.mongo.getArtifact<SceneOutput>(
      project.id,
      'scenes',
    );

    if (!scenesRaw || scenesRaw.status !== 'ready') {
      throw new Error(
        'Scenes must be generated before dialogues. Call /scenes first.',
      );
    }

    if (!directorRaw || directorRaw.status !== 'ready') {
      throw new Error('Director plan must be generated before dialogues.');
    }

    if (!storyRaw || storyRaw.status !== 'ready') {
      throw new Error('Story must be generated before dialogues.');
    }

    this.logger.log(`Generating dialogues for project: "${slug}"`);

    const dialogueOutput = await this.dialogueAgent.execute({
      project: {
        topic: project.name,
        language: project.language,
        platform: project.platform,
        style: project.style,
      },
      directorPlan: directorRaw,
      story: storyRaw,
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

  // ─── Step 5: Prompts + Images ────────────────────────────────────────────

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
    const directorRaw = await this.mongo.getArtifact<DirectorOutput>(
      project.id,
      'director',
    );
    const scenes = await this.mongo.getArtifact<SceneOutput>(
      project.id,
      'scenes',
    );
    const dialogues = await this.mongo.getArtifact<DialogueOutput>(
      project.id,
      'dialogues',
    );

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

  async generateImages(slug: string) {
    const project = await this.loadProject(slug);
    const scenes = await this.mongo.getArtifact<SceneOutput>(
      project.id,
      'scenes',
    );
    const prompts = await this.mongo.getArtifact<PromptOutput>(
      project.id,
      'prompts',
    );

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
      projectId: project.id,
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
    const prompts = await this.mongo.getArtifact<PromptOutput>(
      project.id,
      'prompts',
    );

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
      project.id,
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
    const assets = await this.assetService.listByProject(project.id, 'IMAGE');

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

  // ─── Step 6: Produce (Render + Voice + Subtitles + Compose) ─────────────

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
    const scenes = await this.mongo.getArtifact<SceneOutput>(
      project.id,
      'scenes',
    );
    const dialogues = await this.mongo.getArtifact<DialogueOutput>(
      project.id,
      'dialogues',
    );

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

    const audioAssets = await this.assetService.listByProject(
      project.id,
      'AUDIO',
    );
    const effectiveScenes = scenes.scenes.map((s) => {
      const audioAsset = audioAssets.find(
        (a) => String(a.sceneId) === String(s.id),
      );
      const audioDuration = audioAsset?.duration ?? 0;
      if (audioDuration > 0) {
        return {
          ...s,
          duration: Math.max(s.duration, Math.ceil(audioDuration * 10) / 10),
        };
      }
      return s;
    });

    // Read voice artifact if available to get per-line durations for accurate timing
    const voiceArtifact = await this.mongo.getArtifact<{
      lines: Array<{
        sceneId: string;
        character: string;
        text: string;
        duration: number;
      }>;
      status: string;
    }>(project.id, 'voice');

    let voiceLines: Map<number, VoiceLineTiming[]> | undefined;
    if (voiceArtifact && voiceArtifact.status === 'ready') {
      voiceLines = new Map<number, VoiceLineTiming[]>();
      for (const line of voiceArtifact.lines) {
        const sceneIdNum = Number(line.sceneId);
        if (!voiceLines.has(sceneIdNum)) {
          voiceLines.set(sceneIdNum, []);
        }
        voiceLines.get(sceneIdNum)!.push({
          character: line.character,
          text: line.text,
          duration: line.duration,
        });
      }
    }

    const output = await this.subtitlePipeline.run({
      scenes: effectiveScenes,
      dialogues: dialogues.scenes,
      voiceLines,
    });

    const srtContent = toSrt(output.cues);

    await this.mongo.setArtifact(project.id, 'subtitles', {
      ...output,
      srtContent,
      status: 'ready' as const,
    });
    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: 'Subtitles generated successfully.',
      data: { ...output, srtContent, status: 'ready' },
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

    const dialoguesRaw = await this.mongo.getArtifact<DialogueOutput>(
      project.id,
      'dialogues',
    );

    if (!dialoguesRaw || dialoguesRaw.status !== 'ready') {
      throw new ConflictException(
        'Dialogues must be generated before voice. Call /dialogues first.',
      );
    }

    this.logger.log(`Generating voice for project: "${slug}"`);

    const voiceResult = await this.voiceGenerationService.generateVoice({
      projectId: project.id,
      projectSlug: slug,
      language: project.language,
      scenes: dialoguesRaw.scenes,
    });

    const payload = {
      lines: voiceResult.lines,
      totalDuration: voiceResult.totalDuration,
      status: 'ready' as const,
    };

    await this.mongo.setArtifact(project.id, 'voice', payload);

    const scenesArtifact = await this.mongo.getArtifact<SceneOutput>(
      project.id,
      'scenes',
    );
    if (scenesArtifact && scenesArtifact.scenes) {
      const audioAssets = await this.assetService.listByProject(
        project.id,
        'AUDIO',
      );
      const updatedScenes = scenesArtifact.scenes.map((s) => {
        const audioAsset = audioAssets.find(
          (a) => String(a.sceneId) === String(s.id),
        );
        const audioDuration = audioAsset?.duration ?? 0;
        if (audioDuration > 0) {
          return {
            ...s,
            duration: Math.max(
              s.duration,
              Math.ceil(audioDuration * 10) / 10,
            ),
          };
        }
        return s;
      });
      await this.mongo.setArtifact(project.id, 'scenes', {
        ...scenesArtifact,
        scenes: updatedScenes,
      });
    }

    await this.updateProjectTimestamp(slug);

    this.logger.log(
      `Voice saved for project: "${slug}", lines=${voiceResult.lines.length}`,
    );

    return {
      success: true,
      message: 'Voice generated successfully.',
      data: payload,
    };
  }

  async renderProject(slug: string) {
    const project = await this.loadProject(slug);
    const scenes = await this.mongo.getArtifact<SceneOutput>(
      project.id,
      'scenes',
    );
    const prompts = await this.mongo.getArtifact<PromptOutput>(
      project.id,
      'prompts',
    );
    const assets = await this.assetService.listByProject(project.id, 'IMAGE');
    const audioAssets = await this.assetService.listByProject(
      project.id,
      'AUDIO',
    );

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
      const audioAsset = audioAssets.find(
        (a) => String(a.sceneId) === String(scene.id),
      );
      const audioDuration = audioAsset?.duration ?? 0;

      const duration =
        audioDuration > 0
          ? Math.max(scene.duration, Math.ceil(audioDuration * 10) / 10)
          : scene.duration;

      return {
        id: String(scene.id),
        duration,
        imagePath: imageAsset?.path ?? '',
        prompt: prompt ?? {
          id: scene.id,
          prompt: scene.visualPrompt,
          negativePrompt: '',
          camera: '',
          lighting: '',
          mood: '',
        },
        audioPath: audioAsset?.path,
      };
    });

    const results = await this.sceneRendererService.renderScenes({
      projectId: project.id,
      projectSlug: slug,
      scenes: renderScenes,
    });

    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: `All scenes rendered. ${results.length} scene videos created.`,
      data: results,
    };
  }

  async renderScene(slug: string, sceneId: string) {
    const project = await this.loadProject(slug);
    const scenes = await this.mongo.getArtifact<SceneOutput>(
      project.id,
      'scenes',
    );
    const prompts = await this.mongo.getArtifact<PromptOutput>(
      project.id,
      'prompts',
    );
    const assets = await this.assetService.listByProject(project.id, 'IMAGE');
    const audioAssets = await this.assetService.listByProject(
      project.id,
      'AUDIO',
    );

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

    const audioAsset = audioAssets.find((a) => a.sceneId === sceneId);
    const audioDuration = audioAsset?.duration ?? 0;
    const duration =
      audioDuration > 0
        ? Math.max(scene.duration, Math.ceil(audioDuration * 10) / 10)
        : scene.duration;

    this.logger.log(`Rendering scene ${sceneId} in project: "${slug}"`);

    const results = await this.sceneRendererService.renderScenes({
      projectId: project.id,
      projectSlug: slug,
      scenes: [
        {
          id: sceneId,
          duration,
          imagePath: imageAsset.path!,
          prompt,
          audioPath: audioAsset?.path,
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

  async composeVideo(slug: string) {
    const project = await this.loadProject(slug);
    const scenes = await this.mongo.getArtifact<SceneOutput>(
      project.id,
      'scenes',
    );
    const subtitles = await this.mongo.getArtifact<
      SubtitleOutput & { srtContent: string; finalPath?: string }
    >(project.id, 'subtitles');

    if (!scenes || scenes.status !== 'ready') {
      throw new ConflictException('Scenes must be generated first.');
    }

    if (!subtitles || subtitles.status !== 'ready' || !subtitles.srtContent) {
      throw new ConflictException(
        'Subtitles must be generated before composing.',
      );
    }

    const videoAssets = await this.assetService.listByProject(
      project.id,
      'VIDEO',
    );
    if (videoAssets.length === 0) {
      throw new ConflictException(
        'No rendered video clips found. Render scenes first.',
      );
    }

    const audioAssets = await this.assetService.listByProject(
      project.id,
      'AUDIO',
    );
    if (audioAssets.length === 0) {
      this.logger.warn(
        `No audio assets found for project "${slug}". Video will have no voice.`,
      );
    }

    this.logger.log(`Composing final video for project: "${slug}"`);

    const composeScenes = scenes.scenes.map((s) => {
      const audioAsset = audioAssets.find(
        (a) => String(a.sceneId) === String(s.id),
      );
      const audioDuration = audioAsset?.duration ?? 0;
      const duration =
        audioDuration > 0
          ? Math.max(s.duration, Math.ceil(audioDuration * 10) / 10)
          : s.duration;
      return {
        id: String(s.id),
        duration,
      };
    });

    const result = await this.compositionService.compose({
      projectId: project.id,
      projectSlug: slug,
      scenes: composeScenes,
      srtContent: subtitles.srtContent,
    });

    await this.mongo.setArtifact(project.id, 'subtitles', {
      ...subtitles,
      finalPath: result.finalPath,
      composedAt: result.exportedAt,
    });
    return {
      success: true,
      message: 'Video composed successfully.',
      data: result,
    };
  }

  async getAssets(slug: string, type?: string) {
    const project = await this.loadProject(slug);
    const assets = await this.assetService.listByProject(
      project.id,
      type as 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SUBTITLE' | 'EXPORT' | undefined,
    );
    return {
      success: true,
      message: 'Assets retrieved successfully.',
      data: assets,
    };
  }

  async serveAssetFile(slug: string, assetId: string) {
    const project = await this.loadProject(slug);
    const asset = await this.assetService.findById(assetId);
    if (!asset || asset.projectId !== project.id) {
      throw new NotFoundException(`Asset "${assetId}" not found.`);
    }

    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      srt: 'text/plain',
    };
    const ext = asset.filename?.split('.').pop()?.toLowerCase() ?? 'bin';

    if (asset.gridfsId) {
      const buffer = await this.gridfs.downloadFile(String(asset.gridfsId));
      return {
        buffer,
        filename: asset.filename ?? `asset-${assetId}.${ext}`,
        contentType: mimeMap[ext] ?? 'application/octet-stream',
      };
    }

    if (asset.path?.startsWith('gridfs:')) {
      const gridfsId = asset.path.replace('gridfs:', '');
      const buffer = await this.gridfs.downloadFile(gridfsId);
      return {
        buffer,
        filename: asset.filename ?? `asset-${assetId}.${ext}`,
        contentType: mimeMap[ext] ?? 'application/octet-stream',
      };
    }

    const buffer = await this.storage.readBinary(asset.path!);
    return {
      buffer,
      filename: asset.filename ?? `asset-${assetId}.${ext}`,
      contentType: mimeMap[ext] ?? 'application/octet-stream',
    };
  }

  async downloadFinalVideo(slug: string) {
    const project = await this.loadProject(slug);
    const subtitles = await this.mongo.getArtifact<
      SubtitleOutput & { srtContent: string; finalPath?: string }
    >(project.id, 'subtitles');

    const finalPath = subtitles?.finalPath;
    if (!finalPath) {
      throw new ConflictException(
        'No final video found. Compose the video first.',
      );
    }

    const gridfsId = finalPath.replace('gridfs:', '');
    const buffer = await this.gridfs.downloadFile(gridfsId);
    const filename = `${slug}-final.mp4`;

    return {
      buffer,
      filename,
      contentType: 'video/mp4',
    };
  }

  // ─── Pipeline Status ──────────────────────────────────────────────────────

  async getPipelineStatus(slug: string) {
    const project = await this.loadProject(slug);
    const states = await this.pipelineStateService.findByProject(project.id);
    const jobs = await this.generationQueueService.listByProject(project.id);
    const assets = await this.assetService.listByProject(project.id);

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
      project.id,
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
      project.id,
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

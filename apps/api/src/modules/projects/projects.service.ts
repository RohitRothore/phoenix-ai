import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { LocalStorageService } from '../../common/storage/local-storage.service';
import { LocalFfmpegVideoRendererService } from '../../common/rendering/local-ffmpeg-video-renderer.service';
import { LocalFfmpegExportService } from '../../common/rendering/local-ffmpeg-export.service';
import { DialogueAgent } from '../ai/agents/dialogue/dialogue.agent';
import { DialogueOutput } from '../ai/agents/dialogue/dialogue.types';
import { PromptAgent } from '../ai/agents/prompt/prompt.agent';
import { PromptOutput } from '../ai/agents/prompt/prompt.types';
import { VideoOutput } from '../ai/agents/video/video.types';
import { VideoPreparationPipeline } from '../ai/pipelines/video-preparation.pipeline';
import {
  SubtitleOutput,
  SubtitlePipeline,
  toSrt,
} from '../ai/pipelines/subtitle.pipeline';
import { DirectorAgent } from '../ai/agents/director/director.agent';
import { DirectorOutput } from '../ai/agents/director/director.types';
import { SceneAgent } from '../ai/agents/scene/scene.agent';
import { SceneOutput } from '../ai/agents/scene/scene.types';
import { StoryAgent } from '../ai/agents/story/story.agent';
import { StoryOutput } from '../ai/agents/story/story.types';
import { CreateProjectDto } from './dto/create-project.dto';

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

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
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
  ) {}

  async create(dto: CreateProjectDto): Promise<{ success: boolean; message: string; data: ProjectJson }> {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const projectId = randomUUID();
    const projectPath = `projects/${slug}`;

    const projectPayload: ProjectJson = {
      id: projectId,
      name: dto.name,
      slug,
      language: dto.language,
      platform: dto.platform,
      style: dto.style,
      humor: dto.humor ?? 'light',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.storage.ensureDirectory(projectPath);
    await this.storage.writeJson(`${projectPath}/project.json`, projectPayload);
    await this.storage.writeJson(`${projectPath}/director.json`, {
      status: 'pending',
    });
    await this.storage.writeJson(`${projectPath}/story.json`, {
      status: 'pending',
    });
    await this.storage.writeJson(`${projectPath}/scenes.json`, {
      status: 'pending',
    });
    await this.storage.writeJson(`${projectPath}/dialogues.json`, {
      status: 'pending',
    });
    await this.storage.writeJson(`${projectPath}/prompts.json`, {
      status: 'pending',
    });
    await this.storage.writeJson(`${projectPath}/video.json`, {
      status: 'pending',
    });
    await this.storage.writeJson(`${projectPath}/subtitles.json`, {
      status: 'pending',
    });

    this.logger.log(`Project created: slug="${slug}", id="${projectId}"`);

    return {
      success: true,
      message: 'Project created successfully.',
      data: projectPayload,
    };
  }

  async findOne(slug: string) {
    const projectPath = `projects/${slug}/project.json`;
    const exists = await this.storage.exists(projectPath);

    if (!exists) {
      throw new NotFoundException(`Project "${slug}" not found.`);
    }

    const project = await this.storage.readJson<ProjectJson>(projectPath);

    return {
      success: true,
      message: 'Project retrieved successfully.',
      data: project,
    };
  }

  async getDirectorPlan(slug: string) {
    await this.loadProject(slug);
    const path = `projects/${slug}/director.json`;
    const data = await this.storage.readJson<DirectorArtifact>(path);
    return {
      success: true,
      message: 'Director plan retrieved successfully.',
      data,
    };
  }

  async getStory(slug: string) {
    await this.loadProject(slug);
    const path = `projects/${slug}/story.json`;
    const data = await this.storage.readJson<StoryArtifact>(path);
    return {
      success: true,
      message: 'Story retrieved successfully.',
      data,
    };
  }

  async getScenes(slug: string) {
    await this.loadProject(slug);
    const path = `projects/${slug}/scenes.json`;
    const data = await this.storage.readJson<SceneArtifact>(path);
    return {
      success: true,
      message: 'Scenes retrieved successfully.',
      data,
    };
  }

  async list() {
    const slugs = await this.storage.listDirectories('projects');

    const payload = await Promise.all(
      slugs.map(async (slug): Promise<ProjectJson | null> => {
        const projectPath = `projects/${slug}/project.json`;
        const exists = await this.storage.exists(projectPath);

        if (!exists) {
          return null;
        }

        return this.storage.readJson<ProjectJson>(projectPath);
      }),
    );

    return {
      success: true,
      message: 'Projects retrieved successfully.',
      data: payload.filter((item): item is ProjectJson => item !== null),
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

    const payload: DirectorOutput & { status: string } = {
      ...directorOutput,
      status: 'ready',
    };

    await this.storage.writeJson(`projects/${slug}/director.json`, payload);
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

    const directorRaw = await this.storage.readJson<
      DirectorOutput & { status: string }
    >(`projects/${slug}/director.json`);

    if (directorRaw.status !== 'ready') {
      // Auto-generate director plan if not yet done
      await this.generateDirectorPlan(slug);
      return this.generateStory(slug);
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

    const payload: StoryOutput & { status: string } = {
      ...storyOutput,
      status: 'ready',
    };

    await this.storage.writeJson(`projects/${slug}/story.json`, payload);
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

    const directorRaw = await this.storage.readJson<
      DirectorOutput & { status: string }
    >(`projects/${slug}/director.json`);

    const storyRaw = await this.storage.readJson<
      StoryOutput & { status: string }
    >(`projects/${slug}/story.json`);

    if (storyRaw.status !== 'ready') {
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

    const payload: SceneOutput & { status: string } = {
      ...sceneOutput,
      status: 'ready',
    };

    await this.storage.writeJson(`projects/${slug}/scenes.json`, payload);
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
    await this.loadProject(slug);
    const path = `projects/${slug}/dialogues.json`;
    const data = await this.storage.readJson<DialogueArtifact>(path);
    return {
      success: true,
      message: 'Dialogues retrieved successfully.',
      data,
    };
  }

  async generateDialogues(slug: string) {
    const project = await this.loadProject(slug);

    const directorRaw = await this.storage.readJson<
      DirectorOutput & { status: string }
    >(`projects/${slug}/director.json`);

    const storyRaw = await this.storage.readJson<
      StoryOutput & { status: string }
    >(`projects/${slug}/story.json`);

    const scenesRaw = await this.storage.readJson<
      SceneOutput & { status: string }
    >(`projects/${slug}/scenes.json`);

    if (scenesRaw.status !== 'ready') {
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
      directorPlan: directorRaw,
      story: storyRaw,
      scenes: scenesRaw.scenes,
    });

    const payload: DialogueOutput & { status: string } = {
      ...dialogueOutput,
      status: 'ready',
    };

    await this.storage.writeJson(`projects/${slug}/dialogues.json`, payload);
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
    await this.loadProject(slug);
    const path = `projects/${slug}/prompts.json`;
    const data = (await this.storage.exists(path))
      ? await this.storage.readJson<PromptArtifact>(path)
      : { status: 'pending' as const };

    return {
      success: true,
      message: 'Render prompts retrieved successfully.',
      data,
    };
  }

  async generatePrompts(slug: string) {
    const project = await this.loadProject(slug);
    const directorPlan = await this.storage.readJson<DirectorArtifact>(
      `projects/${slug}/director.json`,
    );
    const scenes = await this.storage.readJson<SceneArtifact>(
      `projects/${slug}/scenes.json`,
    );
    const dialogues = await this.storage.readJson<DialogueArtifact>(
      `projects/${slug}/dialogues.json`,
    );

    if (
      directorPlan.status !== 'ready' ||
      scenes.status !== 'ready' ||
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
      directorPlan,
      scenes: scenes.scenes,
      dialogues: dialogues.scenes,
    });

    const payload: PromptArtifact = { ...output, status: 'ready' };
    await this.storage.writeJson(`projects/${slug}/prompts.json`, payload);
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
    await this.loadProject(slug);
    const path = `projects/${slug}/video.json`;
    const data = (await this.storage.exists(path))
      ? await this.storage.readJson<VideoArtifact>(path)
      : { status: 'pending' as const };

    return {
      success: true,
      message: 'Video render plan retrieved successfully.',
      data,
    };
  }

  async prepareVideo(slug: string) {
    const project = await this.loadProject(slug);
    const scenes = await this.storage.readJson<SceneArtifact>(
      `projects/${slug}/scenes.json`,
    );
    const prompts = await this.storage.readJson<PromptArtifact>(
      `projects/${slug}/prompts.json`,
    );

    if (scenes.status !== 'ready' || prompts.status !== 'ready') {
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
    const payload: VideoArtifact = { ...output, status: 'ready' };

    await this.storage.writeJson(`projects/${slug}/video.json`, payload);
    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: 'Video render plan prepared successfully.',
      data: payload,
    };
  }

  async renderVideo(slug: string) {
    await this.loadProject(slug);
    const path = `projects/${slug}/video.json`;
    const video = await this.storage.readJson<VideoArtifact>(path);

    if (video.status !== 'ready' || video.scenes.length === 0) {
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
      })),
    );
    const payload: VideoArtifact = {
      ...video,
      scenes: video.scenes.map((scene) => ({ ...scene, status: 'ready' })),
      renderStatus: 'completed',
      finalPath: renderedVideo.finalPath,
      renderedAt: renderedVideo.renderedAt,
    };

    await this.storage.writeJson(path, payload);
    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: 'Local fallback video rendered successfully.',
      data: payload,
    };
  }

  async getSubtitles(slug: string) {
    await this.loadProject(slug);
    const path = `projects/${slug}/subtitles.json`;
    const data = (await this.storage.exists(path))
      ? await this.storage.readJson<SubtitleArtifact>(path)
      : { status: 'pending' as const };

    return {
      success: true,
      message: 'Subtitles retrieved successfully.',
      data,
    };
  }

  async generateSubtitles(slug: string) {
    await this.loadProject(slug);
    const scenes = await this.storage.readJson<SceneArtifact>(
      `projects/${slug}/scenes.json`,
    );
    const dialogues = await this.storage.readJson<DialogueArtifact>(
      `projects/${slug}/dialogues.json`,
    );
    if (scenes.status !== 'ready' || dialogues.status !== 'ready') {
      throw new ConflictException(
        'Scenes and dialogues must be generated before subtitles.',
      );
    }

    const output = await this.subtitlePipeline.run({
      scenes: scenes.scenes,
      dialogues: dialogues.scenes,
    });
    const srtPath = 'subtitles/captions.srt';
    await this.storage.writeText(
      `projects/${slug}/${srtPath}`,
      toSrt(output.cues),
    );
    const payload: SubtitleArtifact = { ...output, srtPath, status: 'ready' };
    await this.storage.writeJson(`projects/${slug}/subtitles.json`, payload);
    await this.updateProjectTimestamp(slug);

    return {
      success: true,
      message: 'Subtitles generated successfully.',
      data: payload,
    };
  }

  async exportVideo(slug: string) {
    await this.loadProject(slug);
    const video = await this.storage.readJson<VideoArtifact>(
      `projects/${slug}/video.json`,
    );
    const subtitles = await this.storage.readJson<SubtitleArtifact>(
      `projects/${slug}/subtitles.json`,
    );
    if (
      video.renderStatus !== 'completed' ||
      !video.finalPath ||
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
    await this.loadProject(slug);
    const video = await this.storage.readJson<VideoArtifact>(
      `projects/${slug}/video.json`,
    );
    if (video.renderStatus !== 'completed' || !video.finalPath) {
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

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async loadProject(slug: string): Promise<ProjectJson> {
    const projectPath = `projects/${slug}/project.json`;
    const exists = await this.storage.exists(projectPath);

    if (!exists) {
      throw new NotFoundException(`Project "${slug}" not found.`);
    }

    return this.storage.readJson<ProjectJson>(projectPath);
  }

  private async updateProjectTimestamp(slug: string): Promise<void> {
    const projectPath = `projects/${slug}/project.json`;
    const project = await this.storage.readJson<ProjectJson>(projectPath);
    await this.storage.writeJson(projectPath, {
      ...project,
      updatedAt: new Date().toISOString(),
    });
  }
}

type ArtifactStatus = 'pending' | 'ready';
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

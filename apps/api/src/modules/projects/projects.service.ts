import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { LocalStorageService } from '../../common/storage/local-storage.service';
import { DialogueAgent } from '../ai/agents/dialogue/dialogue.agent';
import { DialogueOutput } from '../ai/agents/dialogue/dialogue.types';
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
  ) { }

  async create(dto: CreateProjectDto) {
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

    console.log({ projectPayload })

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
    const data = await this.storage.readJson<any>(path);
    return {
      success: true,
      message: 'Director plan retrieved successfully.',
      data,
    };
  }

  async getStory(slug: string) {
    await this.loadProject(slug);
    const path = `projects/${slug}/story.json`;
    const data = await this.storage.readJson<any>(path);
    return {
      success: true,
      message: 'Story retrieved successfully.',
      data,
    };
  }

  async getScenes(slug: string) {
    await this.loadProject(slug);
    const path = `projects/${slug}/scenes.json`;
    const data = await this.storage.readJson<any>(path);
    return {
      success: true,
      message: 'Scenes retrieved successfully.',
      data,
    };
  }


  async list() {
    const slugs = await this.storage.listDirectories('projects');

    const payload = await Promise.all(
      slugs.map(async (slug) => {
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
      data: payload.filter(Boolean),
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
    const data = await this.storage.readJson<any>(path);
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

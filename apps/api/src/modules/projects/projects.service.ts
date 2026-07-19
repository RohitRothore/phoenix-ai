import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { LocalStorageService } from '../../common/storage/local-storage.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly storage: LocalStorageService) {}

  async create(dto: CreateProjectDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const projectId = randomUUID();
    const projectPath = `projects/${slug}`;
    const projectPayload = {
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
    await this.storage.writeJson(`${projectPath}/director.json`, { status: 'pending' });
    await this.storage.writeJson(`${projectPath}/story.json`, { status: 'pending' });
    await this.storage.writeJson(`${projectPath}/scenes.json`, { status: 'pending' });

    return {
      success: true,
      message: 'Project created successfully.',
      data: projectPayload,
    };
  }

  async generateDirectorPlan(slug: string) {
    const projectPath = `projects/${slug}/project.json`;
    const project = await this.storage.readJson<{
      name: string;
      language: string;
      platform: string;
      style: string;
      humor: string;
    }>(projectPath);

    const directorPlan = {
      genre: 'Comedy',
      targetAudience: '18-35',
      pacing: 'Fast',
      storyStructure: ['Hook', 'Setup', 'Conflict', 'Punchline'],
      topic: project.name,
      language: project.language,
      platform: project.platform,
      style: project.style,
      humor: project.humor,
      status: 'ready',
      generatedAt: new Date().toISOString(),
    };

    await this.storage.writeJson(`projects/${slug}/director.json`, directorPlan);

    return {
      success: true,
      message: 'Director plan generated successfully.',
      data: directorPlan,
    };
  }

  async generateStory(slug: string) {
    const projectPath = `projects/${slug}/project.json`;
    const project = await this.storage.readJson<{
      name: string;
      language: string;
      style: string;
      platform: string;
      humor: string;
    }>(projectPath);

    const story = {
      title: project.name,
      hook: `A fast-paced setup for ${project.name} using a ${project.humor} tone in ${project.language}.`,
      summary: `This story follows ${project.name} across a ${project.platform} comedy format with ${project.style} energy.`,
      ending: 'The payoff lands with a sharp comedic twist.',
      status: 'ready',
      generatedAt: new Date().toISOString(),
    };

    await this.storage.writeJson(`projects/${slug}/story.json`, story);

    return {
      success: true,
      message: 'Story generated successfully.',
      data: story,
    };
  }

  async list() {
    const projects = await this.storage.listDirectories('projects');
    const payload = await Promise.all(
      projects.map(async (slug) => {
        const projectPath = `projects/${slug}/project.json`;
        const exists = await this.storage.exists(projectPath);

        if (!exists) {
          return null;
        }

        return this.storage.readJson(projectPath);
      }),
    );

    return {
      success: true,
      message: 'Projects retrieved successfully.',
      data: payload.filter(Boolean),
    };
  }
}

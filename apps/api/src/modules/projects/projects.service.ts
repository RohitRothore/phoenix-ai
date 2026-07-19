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

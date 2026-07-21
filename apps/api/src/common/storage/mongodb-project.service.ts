import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Project, ProjectDocument } from './schemas/project.schema';
import {
  ProjectArtifact,
  type ArtifactStatus,
  type ProjectArtifactDocument,
} from './schemas/project-artifacts.schema';

@Injectable()
export class MongoDBProjectService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectArtifact.name)
    private readonly artifactModel: Model<ProjectArtifact>,
  ) {}

  async createProject(data: Partial<Project>): Promise<ProjectDocument> {
    const project = new this.projectModel(data);
    return project.save();
  }

  async findBySlug(slug: string): Promise<ProjectDocument | null> {
    return this.projectModel.findOne({ slug }).exec();
  }

  async findById(id: string): Promise<ProjectDocument | null> {
    return this.projectModel.findOne({ id }).exec();
  }

  async listProjects(): Promise<ProjectDocument[]> {
    return this.projectModel.find().exec();
  }

  async updateProject(
    slug: string,
    data: Partial<Project>,
  ): Promise<ProjectDocument | null> {
    return this.projectModel
      .findOneAndUpdate(
        { slug },
        { ...data, updatedAt: new Date().toISOString() },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async deleteProject(slug: string): Promise<boolean> {
    const result = await this.projectModel.deleteOne({ slug }).exec();
    await this.artifactModel.deleteMany({ projectId: slug }).exec();
    return result.deletedCount > 0;
  }

  async setArtifact<T extends Record<string, unknown>>(
    projectId: string,
    type:
      | 'director'
      | 'story'
      | 'scenes'
      | 'dialogues'
      | 'prompts'
      | 'video'
      | 'subtitles'
      | 'voice',
    data: T,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    await this.artifactModel
      .findOneAndUpdate(
        { projectId, type },
        {
          projectId,
          type,
          data,
          status: data.status || 'pending',
          ...extra,
          updatedAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
  }

  async getArtifact<T>(
    projectId: string,
    type:
      | 'director'
      | 'story'
      | 'scenes'
      | 'dialogues'
      | 'prompts'
      | 'video'
      | 'subtitles'
      | 'voice',
  ): Promise<(T & { status: ArtifactStatus }) | null> {
    const artifact = await this.artifactModel
      .findOne({ projectId, type })
      .exec();
    if (!artifact) return null;

    const base = artifact.toObject();
    return { ...(base.data as T), status: base.status };
  }

  async listArtifacts(projectId: string): Promise<ProjectArtifactDocument[]> {
    return this.artifactModel.find({ projectId }).exec();
  }
}

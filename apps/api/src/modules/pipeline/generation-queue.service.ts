import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  GenerationJob,
  GenerationJobDocument,
  JobStatus,
} from '../../common/storage/schemas';

export interface QueueJobInput {
  projectId: string;
  sceneId: string;
  type: string;
  provider: string;
  request?: Record<string, unknown>;
}

@Injectable()
export class GenerationQueueService {
  private readonly logger = new Logger(GenerationQueueService.name);

  constructor(
    @InjectModel(GenerationJob.name)
    private readonly jobModel: Model<GenerationJobDocument>,
  ) {}

  async enqueue(input: QueueJobInput): Promise<GenerationJobDocument> {
    const job = new this.jobModel({
      ...input,
      status: 'queued',
      retryCount: 0,
      logs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return job.save();
  }

  async setStatus(
    jobId: string,
    status: JobStatus,
  ): Promise<GenerationJobDocument | null> {
    const update: Partial<GenerationJob> = { status, updatedAt: new Date() };
    if (status === 'running') {
      update.startedAt = new Date();
    } else if (status === 'completed') {
      update.completedAt = new Date();
    } else if (status === 'failed') {
      update.failedAt = new Date();
    }
    return this.jobModel.findByIdAndUpdate(jobId, update, { new: true }).exec();
  }

  async setResponse(
    jobId: string,
    response: Record<string, unknown>,
  ): Promise<GenerationJobDocument | null> {
    return this.jobModel
      .findByIdAndUpdate(
        jobId,
        { response, updatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async addLog(
    jobId: string,
    entry: { timestamp: Date; level: string; message: string },
  ): Promise<GenerationJobDocument | null> {
    return this.jobModel
      .findByIdAndUpdate(
        jobId,
        { $push: { logs: entry }, $set: { updatedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async listByProject(projectId: string): Promise<GenerationJobDocument[]> {
    return this.jobModel.find({ projectId }).sort({ createdAt: -1 }).exec();
  }

  async retry(jobId: string): Promise<GenerationJobDocument | null> {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) return null;
    const retryCount = (job.retryCount ?? 0) + 1;
    return this.jobModel
      .findByIdAndUpdate(
        jobId,
        {
          status: 'queued',
          retryCount,
          startedAt: undefined,
          completedAt: undefined,
          failedAt: undefined,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }
}

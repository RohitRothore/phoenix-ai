import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  PipelineState,
  PipelineStateDocument,
  PipelineStage,
  PipelineStatus,
} from '../../common/storage/schemas';

export interface PipelineLogEntry {
  timestamp: Date;
  level: string;
  message: string;
}

@Injectable()
export class PipelineStateService {
  private readonly logger = new Logger(PipelineStateService.name);

  constructor(
    @InjectModel(PipelineState.name)
    private readonly stateModel: Model<PipelineStateDocument>,
  ) {}

  async create(
    projectId: string,
    stage: PipelineStage,
  ): Promise<PipelineStateDocument> {
    const state = new this.stateModel({
      projectId,
      stage,
      status: 'pending',
      retryCount: 0,
      logs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return state.save();
  }

  async update(
    projectId: string,
    stage: PipelineStage,
    data: Partial<PipelineState>,
  ): Promise<PipelineStateDocument | null> {
    return this.stateModel
      .findOneAndUpdate(
        { projectId, stage },
        { ...data, updatedAt: new Date() },
        { new: true, upsert: true },
      )
      .exec();
  }

  async setStatus(
    projectId: string,
    stage: PipelineStage,
    status: PipelineStatus,
  ): Promise<PipelineStateDocument | null> {
    const update: Partial<PipelineState> = { status, updatedAt: new Date() };
    if (status === 'running') {
      update.startedAt = new Date();
    } else if (status === 'completed') {
      update.completedAt = new Date();
    } else if (status === 'failed') {
      update.failedAt = new Date();
    } else if (status === 'cancelled') {
      update.cancelledAt = new Date();
    }
    return this.update(projectId, stage, update);
  }

  async addLog(
    projectId: string,
    stage: PipelineStage,
    entry: PipelineLogEntry,
  ): Promise<PipelineStateDocument | null> {
    return this.stateModel
      .findOneAndUpdate(
        { projectId, stage },
        {
          $push: { logs: entry },
          $set: { updatedAt: new Date() },
        },
        { new: true, upsert: true },
      )
      .exec();
  }

  async findByProject(projectId: string): Promise<PipelineStateDocument[]> {
    return this.stateModel.find({ projectId }).exec();
  }

  async findByProjectAndStage(
    projectId: string,
    stage: PipelineStage,
  ): Promise<PipelineStateDocument | null> {
    return this.stateModel.findOne({ projectId, stage }).exec();
  }

  async retry(
    projectId: string,
    stage: PipelineStage,
  ): Promise<PipelineStateDocument | null> {
    const state = await this.findByProjectAndStage(projectId, stage);
    const retryCount = (state?.retryCount ?? 0) + 1;
    return this.update(projectId, stage, {
      status: 'pending',
      retryCount,
      startedAt: undefined,
      completedAt: undefined,
      failedAt: undefined,
    });
  }

  async resume(
    projectId: string,
    stage: PipelineStage,
  ): Promise<PipelineStateDocument | null> {
    return this.setStatus(projectId, stage, 'pending');
  }
}

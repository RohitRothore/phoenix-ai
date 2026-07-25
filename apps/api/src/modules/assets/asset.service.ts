import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Asset, AssetDocument, AssetType } from '../../common/storage/schemas';

export interface CreateAssetInput {
  projectId: string;
  sceneId: string;
  type: AssetType;
  filename: string;
  path: string;
  url?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  seed?: number;
  provider?: string;
  model?: string;
  generationTime?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
  ) {}

  async create(input: CreateAssetInput): Promise<AssetDocument> {
    const asset = new this.assetModel({
      ...input,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return asset.save();
  }

  async upsert(
    projectId: string,
    sceneId: string,
    type: AssetType,
    data: Omit<CreateAssetInput, 'projectId' | 'sceneId' | 'type'>,
  ): Promise<AssetDocument> {
    return this.assetModel
      .findOneAndUpdate(
        { projectId, sceneId, type },
        { ...data, status: 'pending', updatedAt: new Date() },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      )
      .exec();
  }

  async update(
    id: string,
    data: Partial<Asset>,
  ): Promise<AssetDocument | null> {
    return this.assetModel
      .findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async findById(id: string): Promise<AssetDocument | null> {
    return this.assetModel.findById(id).exec();
  }

  async findByProjectAndScene(
    projectId: string,
    sceneId: string,
    type: AssetType,
  ): Promise<AssetDocument | null> {
    return this.assetModel.findOne({ projectId, sceneId, type }).exec();
  }

  async listByProject(
    projectId: string,
    type?: AssetType,
  ): Promise<AssetDocument[]> {
    const filter: Record<string, unknown> = { projectId };
    if (type) {
      filter.type = type;
    }
    return this.assetModel.find(filter).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.assetModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async getDownloadUrl(id: string): Promise<string> {
    const asset = await this.findById(id);
    if (!asset) {
      throw new NotFoundException(`Asset "${id}" not found.`);
    }
    return asset.path ?? '';
  }
}

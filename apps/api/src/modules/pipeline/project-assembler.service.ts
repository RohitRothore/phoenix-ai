import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Export, ExportDocument } from '../../common/storage/schemas';
import { AssetService } from '../assets/asset.service';

export interface AssembleProjectInput {
  projectId: string;
  projectSlug: string;
  scenes: Array<{
    id: string;
    duration: number;
    imagePath: string;
  }>;
}

@Injectable()
export class ProjectAssemblerService {
  private readonly logger = new Logger(ProjectAssemblerService.name);

  constructor(
    @InjectModel(Export.name)
    private readonly exportModel: Model<ExportDocument>,
    private readonly assetService: AssetService,
  ) {}

  async assembleExport(input: AssembleProjectInput): Promise<ExportDocument> {
    const exportDoc = new this.exportModel({
      projectId: input.projectId,
      filename: `${input.projectSlug}-final.mp4`,
      path: `exports/${input.projectSlug}-final.mp4`,
      status: 'pending',
      metadata: {
        sceneCount: input.scenes.length,
        totalDuration: input.scenes.reduce((sum, s) => sum + s.duration, 0),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return exportDoc.save();
  }

  async updateExport(
    id: string,
    data: Partial<Export>,
  ): Promise<ExportDocument | null> {
    return this.exportModel
      .findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true })
      .exec();
  }

  async getExportByProject(projectId: string): Promise<ExportDocument | null> {
    return this.exportModel
      .findOne({ projectId })
      .sort({ createdAt: -1 })
      .exec();
  }
}

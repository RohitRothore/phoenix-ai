import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ProjectSchema,
  ProjectArtifactSchema,
  AssetSchema,
  PipelineStateSchema,
  GenerationJobSchema,
  ExportSchema,
} from './schemas';
import { MongoDBProjectService } from './mongodb-project.service';
import { LocalStorageService } from './local-storage.service';
import { GridFsService } from './gridfs.service';
import { AssetService } from '../../modules/assets/asset.service';
import { PipelineStateService } from '../../modules/pipeline/pipeline-state.service';
import { FfmpegProcessService } from '../../common/rendering/ffmpeg-process.service';
import { GenerationQueueService } from 'src/modules/pipeline/generation-queue.service';
import { ProjectAssemblerService } from 'src/modules/pipeline/project-assembler.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Project', schema: ProjectSchema },
      { name: 'ProjectArtifact', schema: ProjectArtifactSchema },
      { name: 'Asset', schema: AssetSchema },
      { name: 'PipelineState', schema: PipelineStateSchema },
      { name: 'GenerationJob', schema: GenerationJobSchema },
      { name: 'Export', schema: ExportSchema },
    ]),
  ],
  providers: [
    MongoDBProjectService,
    LocalStorageService,
    GridFsService,
    AssetService,
    PipelineStateService,
    GenerationQueueService,
    ProjectAssemblerService,
    FfmpegProcessService,
  ],
  exports: [
    MongoDBProjectService,
    LocalStorageService,
    GridFsService,
    AssetService,
    PipelineStateService,
    GenerationQueueService,
    ProjectAssemblerService,
    FfmpegProcessService,
  ],
})
export class StorageModule {}

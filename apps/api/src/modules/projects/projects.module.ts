import { Module } from '@nestjs/common';

import { StorageModule } from '../../common/storage/storage.module';
import { LocalStorageService } from '../../common/storage/local-storage.service';
import { LocalFfmpegVideoRendererService } from '../../common/rendering/local-ffmpeg-video-renderer.service';
import { LocalFfmpegExportService } from '../../common/rendering/local-ffmpeg-export.service';
import { AiModule } from '../ai/ai.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AiModule, StorageModule, PipelineModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    LocalStorageService,
    LocalFfmpegVideoRendererService,
    LocalFfmpegExportService,
  ],
})
export class ProjectsModule {}

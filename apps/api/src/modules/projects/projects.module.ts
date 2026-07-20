import { Module } from '@nestjs/common';

import { LocalStorageService } from '../../common/storage/local-storage.service';
import { LocalFfmpegVideoRendererService } from '../../common/rendering/local-ffmpeg-video-renderer.service';
import { FfmpegProcessService } from '../../common/rendering/ffmpeg-process.service';
import { LocalFfmpegExportService } from '../../common/rendering/local-ffmpeg-export.service';
import { AiModule } from '../ai/ai.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AiModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    LocalStorageService,
    FfmpegProcessService,
    LocalFfmpegVideoRendererService,
    LocalFfmpegExportService,
  ],
})
export class ProjectsModule {}

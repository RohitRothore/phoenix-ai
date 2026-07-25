import { Module } from '@nestjs/common';

import { StorageModule } from '../../common/storage/storage.module';
import { AiModule } from '../ai/ai.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AiModule, StorageModule, PipelineModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}

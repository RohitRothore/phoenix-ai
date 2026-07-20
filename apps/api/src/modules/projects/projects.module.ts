import { Module } from '@nestjs/common';

import { LocalStorageService } from '../../common/storage/local-storage.service';
import { AiModule } from '../ai/ai.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AiModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, LocalStorageService],
})
export class ProjectsModule {}

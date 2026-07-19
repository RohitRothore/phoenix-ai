import { Module } from '@nestjs/common';

import { LocalStorageService } from '../../common/storage/local-storage.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, LocalStorageService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

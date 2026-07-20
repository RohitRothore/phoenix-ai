import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProjectSchema, ProjectArtifactSchema } from './schemas';
import { MongoDBProjectService } from './mongodb-project.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Project', schema: ProjectSchema },
      { name: 'ProjectArtifact', schema: ProjectArtifactSchema },
    ]),
  ],
  providers: [MongoDBProjectService],
  exports: [MongoDBProjectService],
})
export class StorageModule {}
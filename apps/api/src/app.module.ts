import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './modules/ai/ai.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { StorageModule } from './common/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/phoenix-ai',
    ),
    AiModule,
    ProjectsModule,
    PipelineModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

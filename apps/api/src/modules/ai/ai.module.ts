import { Module } from '@nestjs/common';

import { DirectorAgent } from './agents/director/director.agent';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  providers: [AiService, DirectorAgent],
})
export class AiModule {}

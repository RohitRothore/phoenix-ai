import { Body, Controller, Post } from '@nestjs/common';

import { AiService } from './ai.service';
import { GenerateStoryDto } from './dto/generate-story.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('story')
  generate(@Body() body: GenerateStoryDto) {
    return this.aiService.generateStory();
  }
}

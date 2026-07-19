import { Injectable } from '@nestjs/common';
import { DirectorAgent } from './agents/director/director.agent';

@Injectable()
export class AiService {
  constructor(private readonly directorAgent: DirectorAgent) {}

  async generateStory() {
    const result = await this.directorAgent.execute({
      topic: 'Comedy short',
      duration: 30,
      humor: 'Sarcastic',
      style: 'Pixar',
      language: 'Hindi',
      platform: 'YouTube Shorts',
    });

    return result;
  }
}

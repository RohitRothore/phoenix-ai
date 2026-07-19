import { Injectable } from '@nestjs/common';
import { DirectorAgent } from './agents/director/director.agent';

@Injectable()
export class AiService {
  constructor(private readonly directorAgent: DirectorAgent) {}

  async generateStory() {
    const result = await this.directorAgent.execute({});

    return result;
  }
}

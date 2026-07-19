import { Injectable } from '@nestjs/common';

import { DirectorInput, DirectorOutput } from './director.types';

@Injectable()
export class DirectorAgent {
  async execute(input: DirectorInput): Promise<DirectorOutput> {
    console.log(input);

    return {
      genre: 'Comedy',

      targetAudience: '18-35',

      pacing: 'Fast',

      storyStructure: ['Hook', 'Setup', 'Conflict', 'Punchline'],
    };
  }
}

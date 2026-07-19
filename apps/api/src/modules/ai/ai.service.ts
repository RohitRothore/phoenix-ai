import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async generateStory() {
    return {
      title: 'Bandar Bana Software Engineer',
      hook: 'Ek bandar ko Google me job mil gayi...',
      story:
        'Ek bandar IT company join karta hai aur har meeting me sirf banana khata rehta hai.',
      characters: ['Bandar', 'Manager', 'HR'],
    };
  }
}

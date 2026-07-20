import { DialogueOutput } from '../dialogue/dialogue.types';

export interface VoiceInput {
  project: {
    topic: string;
    language: string;
    platform: string;
    style: string;
  };
  dialogues: DialogueOutput;
}

export interface VoiceLine {
  sceneId: string;
  character: string;
  text: string;
  emotion: string;
  audioPath: string;
  duration: number;
  status: 'pending' | 'ready' | 'error';
}

export interface VoiceOutput {
  scenes: VoiceLine[];
  status: 'pending' | 'ready' | 'error';
  generatedAt?: string;
}

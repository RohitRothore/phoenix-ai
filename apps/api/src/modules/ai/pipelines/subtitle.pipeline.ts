import { ConflictException, Injectable } from '@nestjs/common';
import { Pipeline } from '@phoenix/ai-core';

import { DialogueOutput } from '../agents/dialogue/dialogue.types';
import { SceneItem } from '../agents/scene/scene.types';

export interface SubtitleCue {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

export interface SubtitleOutput {
  cues: SubtitleCue[];
  generatedAt: string;
}

export interface SubtitleInput {
  scenes: SceneItem[];
  dialogues: DialogueOutput['scenes'];
}

@Injectable()
export class SubtitlePipeline implements Pipeline<SubtitleInput, SubtitleOutput> {
  async run(input: SubtitleInput): Promise<SubtitleOutput> {
    const dialogueByScene = new Map(input.dialogues.map((scene) => [scene.id, scene.dialogue]));
    let elapsedSeconds = 0;
    const cues: SubtitleCue[] = [];

    for (const scene of input.scenes) {
      const lines = dialogueByScene.get(scene.id);
      if (!lines) {
        throw new ConflictException(`Dialogue is missing for scene ${scene.id}.`);
      }
      const cueDuration = lines.length === 0 ? scene.duration : scene.duration / lines.length;

      lines.forEach((line, index) => {
        const start = elapsedSeconds + cueDuration * index;
        cues.push({
          index: cues.length + 1,
          startTime: formatSrtTimestamp(start),
          endTime: formatSrtTimestamp(start + cueDuration),
          text: `${line.character}: ${line.text}`,
        });
      });
      elapsedSeconds += scene.duration;
    }

    return { cues, generatedAt: new Date().toISOString() };
  }
}

export function toSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue) => `${cue.index}\n${cue.startTime} --> ${cue.endTime}\n${cue.text}`)
    .join('\n\n');
}

function formatSrtTimestamp(seconds: number): string {
  const totalMilliseconds = Math.round(seconds * 1000);
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const remainingSeconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

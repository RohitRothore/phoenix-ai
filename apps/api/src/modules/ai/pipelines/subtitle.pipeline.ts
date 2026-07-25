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
export class SubtitlePipeline implements Pipeline<
  SubtitleInput,
  SubtitleOutput
> {
  async run(input: SubtitleInput): Promise<SubtitleOutput> {
    const dialogueByScene = new Map(
      input.dialogues.map((scene) => [scene.id, scene.dialogue]),
    );
    let elapsedSeconds = 0;
    const cues: SubtitleCue[] = [];
    const GAP = 0.1;
    const MIN_CUE_DURATION = 0.5;

    for (const scene of input.scenes) {
      const lines = dialogueByScene.get(scene.id);
      if (!lines) {
        throw new ConflictException(
          `Dialogue is missing for scene ${scene.id}.`,
        );
      }
      if (lines.length === 0) {
        elapsedSeconds += scene.duration;
        continue;
      }

      const totalWords = lines.reduce(
        (sum, line) => sum + line.text.split(/\s+/).length,
        0,
      );
      const gapBudget = GAP * Math.max(0, lines.length - 1);
      const availableDuration = Math.max(
        scene.duration - gapBudget,
        MIN_CUE_DURATION * lines.length,
      );

      let cursor = elapsedSeconds;
      for (const line of lines) {
        const wordCount = Math.max(1, line.text.split(/\s+/).length);
        const proportion =
          totalWords > 0 ? wordCount / totalWords : 1 / lines.length;
        const cueDuration = Math.max(
          MIN_CUE_DURATION,
          availableDuration * proportion,
        );

        cues.push({
          index: cues.length + 1,
          startTime: formatSrtTimestamp(cursor),
          endTime: formatSrtTimestamp(cursor + cueDuration),
          text: `${line.character}: ${line.text}`,
        });
        cursor += cueDuration + GAP;
      }
      elapsedSeconds += scene.duration;
    }

    return { cues, generatedAt: new Date().toISOString() };
  }
}

export function toSrt(cues: SubtitleCue[]): string {
  return cues
    .map(
      (cue) => `${cue.index}\n${cue.startTime} --> ${cue.endTime}\n${cue.text}`,
    )
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

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

export interface VoiceLineTiming {
  character: string;
  text: string;
  duration: number;
}

export interface SubtitleInput {
  scenes: SceneItem[];
  dialogues: DialogueOutput['scenes'];
  voiceLines?: Map<number, VoiceLineTiming[]>;
}

const COMEDY_PAUSES: Record<string, number> = {
  opening: 0.0,
  reaction: 0.15,
  buildup: 0.0,
  punchline: 0.25,
  exit: 0.1,
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

@Injectable()
export class SubtitlePipeline implements Pipeline<
  SubtitleInput,
  SubtitleOutput
> {
  private static readonly MAX_LINE_LENGTH = 40;
  private static readonly WORDS_PER_LINE = 8;
  private static readonly MIN_CUE_DURATION = 0.5;
  private static readonly MAX_CUE_DURATION = 5.0;
  private static readonly OVERLAP = 0.01;

  async run(input: SubtitleInput): Promise<SubtitleOutput> {
    const dialogueByScene = new Map(
      input.dialogues.map((scene) => [scene.id, scene.dialogue]),
    );
    let elapsedSeconds = 0;
    const cues: SubtitleCue[] = [];

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

      const totalSceneWords = lines.reduce(
        (sum, line) => sum + line.text.split(/\s+/).length,
        0,
      );

      const sceneVoiceLines = input.voiceLines?.get(scene.id);

      let sceneCursor = elapsedSeconds;
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const subLines = this.breakIntoSubLines(line.text);

        const pauseDuration = COMEDY_PAUSES[line.timing] ?? 0;

        const voiceLine = sceneVoiceLines
          ? this.findVoiceLine(sceneVoiceLines, line, lineIndex)
          : undefined;

        let totalLineDuration: number;
        if (voiceLine && voiceLine.duration > 0) {
          totalLineDuration = voiceLine.duration;
        } else {
          const lineWordCount = Math.max(1, line.text.split(/\s+/).length);
          const lineProportion =
            totalSceneWords > 0
              ? lineWordCount / totalSceneWords
              : 1 / lines.length;
          totalLineDuration = Math.max(
            SubtitlePipeline.MIN_CUE_DURATION,
            scene.duration * lineProportion,
          );
        }

        const speechDuration = Math.max(
          SubtitlePipeline.MIN_CUE_DURATION,
          totalLineDuration - pauseDuration,
        );

        const totalSubLineWords = subLines.reduce(
          (sum, l) => sum + l.split(/\s+/).length,
          0,
        );

        const cueDurations: number[] = subLines.map((sl) => {
          const wordCount = Math.max(1, sl.split(/\s+/).length);
          const proportion =
            totalSubLineWords > 0 ? wordCount / totalSubLineWords : 1 / subLines.length;
          return Math.min(
            SubtitlePipeline.MAX_CUE_DURATION,
            Math.max(SubtitlePipeline.MIN_CUE_DURATION, speechDuration * proportion),
          );
        });

        const totalCueDuration = cueDurations.reduce((s, d) => s + d, 0);
        const normalizedDurations = cueDurations.map(
          (d) => (d / totalCueDuration) * speechDuration,
        );

        const cueStartBase = sceneCursor + pauseDuration;

        for (let si = 0; si < subLines.length; si++) {
          const cueStart = cueStartBase + normalizedDurations
            .slice(0, si)
            .reduce((sum, d) => sum + d, 0);

          const cueEnd = cueStart + normalizedDurations[si];

          cues.push({
            index: cues.length + 1,
            startTime: formatSrtTimestamp(cueStart + SubtitlePipeline.OVERLAP),
            endTime: formatSrtTimestamp(cueEnd - SubtitlePipeline.OVERLAP),
            text: `${line.character}: ${subLines[si]}`,
          });
        }

        sceneCursor += totalLineDuration;
      }

      elapsedSeconds += Math.max(scene.duration, sceneCursor - elapsedSeconds);
    }

    return { cues, generatedAt: new Date().toISOString() };
  }

  private findVoiceLine(
    voiceLines: VoiceLineTiming[],
    line: { character: string; text: string },
    lineIndex: number,
  ): VoiceLineTiming | undefined {
    const normText = normalizeText(line.text);
    const normChar = line.character.trim().toLowerCase();

    const characterMatches = voiceLines.filter(
      (vl) => vl.character.trim().toLowerCase() === normChar,
    );

    const exactMatch = characterMatches.find(
      (vl) => normalizeText(vl.text) === normText,
    );
    if (exactMatch) return exactMatch;

    const containsMatch = characterMatches.find(
      (vl) =>
        normalizeText(vl.text).includes(normText) ||
        normText.includes(normalizeText(vl.text)),
    );
    if (containsMatch) return containsMatch;

    if (characterMatches.length > 0) {
      const idxMatch = characterMatches[lineIndex % characterMatches.length];
      if (idxMatch) return idxMatch;
    }

    return voiceLines[lineIndex % voiceLines.length];
  }

  private breakIntoSubLines(text: string): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (
        testLine.length > SubtitlePipeline.MAX_LINE_LENGTH ||
        (currentLine &&
          testLine.split(/\s+/).length > SubtitlePipeline.WORDS_PER_LINE)
      ) {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
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
  const remSeconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

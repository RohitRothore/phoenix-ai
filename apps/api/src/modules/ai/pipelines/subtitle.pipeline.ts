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

@Injectable()
export class SubtitlePipeline implements Pipeline<
  SubtitleInput,
  SubtitleOutput
> {
  private static readonly MAX_LINE_LENGTH = 40;
  private static readonly WORDS_PER_LINE = 8;
  private static readonly MIN_CUE_DURATION = 0.8;
  private static readonly MAX_CUE_DURATION = 4.0;
  private static readonly GAP = 0.08;
  private static readonly OVERLAP_BUFFER = 0.05;

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

      // Get voice line timings for this scene if available
      const sceneVoiceLines = input.voiceLines?.get(scene.id);

      let sceneCursor = elapsedSeconds;
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const subLines = this.breakIntoSubLines(line.text);

        // Use actual voice line duration when available, otherwise estimate
        const voiceLine = sceneVoiceLines
          ? this.findVoiceLine(sceneVoiceLines, line, lineIndex)
          : undefined;

        let lineDuration: number;
        if (voiceLine && voiceLine.duration > 0) {
          lineDuration = Math.max(
            SubtitlePipeline.MIN_CUE_DURATION,
            voiceLine.duration,
          );
        } else {
          const lineWordCount = Math.max(1, line.text.split(/\s+/).length);
          const lineProportion =
            totalSceneWords > 0
              ? lineWordCount / totalSceneWords
              : 1 / lines.length;
          lineDuration = Math.max(
            SubtitlePipeline.MIN_CUE_DURATION,
            scene.duration * lineProportion,
          );
        }

        const totalSubLineWords = subLines.reduce(
          (sum, l) => sum + l.split(/\s+/).length,
          0,
        );

        for (const subLine of subLines) {
          const wordCount = Math.max(1, subLine.split(/\s+/).length);
          const subProportion =
            totalSubLineWords > 0
              ? wordCount / totalSubLineWords
              : 1 / subLines.length;
          const cueDuration = Math.min(
            SubtitlePipeline.MAX_CUE_DURATION,
            Math.max(
              SubtitlePipeline.MIN_CUE_DURATION,
              lineDuration * subProportion,
            ),
          );

          cues.push({
            index: cues.length + 1,
            startTime: formatSrtTimestamp(
              sceneCursor + SubtitlePipeline.OVERLAP_BUFFER,
            ),
            endTime: formatSrtTimestamp(
              sceneCursor + cueDuration - SubtitlePipeline.OVERLAP_BUFFER,
            ),
            text: `${line.character}: ${subLine}`,
          });
          sceneCursor += cueDuration + SubtitlePipeline.GAP;
        }
      }
      elapsedSeconds += scene.duration;
    }

    return { cues, generatedAt: new Date().toISOString() };
  }

  /**
   * Find the matching voice line by character name and text similarity.
   * Falls back to index-based matching if text doesn't match exactly.
   */
  private findVoiceLine(
    voiceLines: VoiceLineTiming[],
    line: { character: string; text: string },
    lineIndex: number,
  ): VoiceLineTiming | undefined {
    // Try exact match first
    const exactMatch = voiceLines.find(
      (vl) =>
        vl.character === line.character &&
        vl.text.toLowerCase() === line.text.toLowerCase(),
    );
    if (exactMatch) return exactMatch;

    // Try character match with index fallback
    const characterMatches = voiceLines.filter(
      (vl) => vl.character === line.character,
    );
    if (characterMatches[lineIndex]) return characterMatches[lineIndex];

    // Try any match by character
    if (characterMatches.length > 0) return characterMatches[0];

    // Fall back to index-based match
    return voiceLines[lineIndex];
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
  const remainingSeconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

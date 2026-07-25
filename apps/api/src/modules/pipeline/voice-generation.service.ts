import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Inject } from '@nestjs/common';
import { PROVIDER_REGISTRY } from '../provider/provider.module';
import { ProviderRegistry } from '@phoenix/providers';
import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { GridFsService } from '../../common/storage/gridfs.service';

const execFileAsync = promisify(execFile);

export interface VoiceLineResult {
  sceneId: string;
  character: string;
  text: string;
  emotion: string;
  audioAssetId: string;
  duration: number;
  status: 'ready' | 'error';
  errorMessage?: string;
}

export interface VoiceGenerationResult {
  lines: VoiceLineResult[];
  totalDuration: number;
}

export interface VoiceGenerationInput {
  projectId: string;
  projectSlug: string;
  language: string;
  scenes: Array<{
    id: number;
    duration: number;
    dialogue: Array<{
      character: string;
      text: string;
      emotion: string;
      timing: string;
    }>;
  }>;
}

@Injectable()
export class VoiceGenerationService {
  private readonly logger = new Logger(VoiceGenerationService.name);

  private readonly englishVoices = [
    'en-US-JennyNeural',
    'en-US-GuyNeural',
    'en-US-AriaNeural',
    'en-US-DavisNeural',
    'en-US-SaraNeural',
    'en-US-TonyNeural',
    'en-US-NancyNeural',
    'en-US-AndrewNeural',
  ];

  private readonly hindiVoices = [
    'hi-IN-SwaraNeural',
    'hi-IN-MadhurNeural',
    'hi-IN-SureshNeural',
  ];

  private characterVoiceMap = new Map<string, string>();
  private voiceIndex = 0;

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
    private readonly assetService: AssetService,
    private readonly pipelineState: PipelineStateService,
    private readonly gridfs: GridFsService,
  ) {}

  async generateVoice(
    input: VoiceGenerationInput,
  ): Promise<VoiceGenerationResult> {
    const { projectId, projectSlug, language, scenes } = input;
    const results: VoiceLineResult[] = [];
    let totalDuration = 0;

    this.characterVoiceMap.clear();
    this.voiceIndex = 0;

    const voices =
      language.toLowerCase().includes('hindi') ||
      language.toLowerCase().includes('hi')
        ? this.hindiVoices
        : this.englishVoices;

    await this.pipelineState.setStatus(
      projectId,
      'voice-generation',
      'running',
    );
    await this.pipelineState.addLog(projectId, 'voice-generation', {
      timestamp: new Date(),
      level: 'info',
      message: `Starting voice generation for ${scenes.length} scenes`,
    });

    for (const scene of scenes) {
      for (const line of scene.dialogue) {
        try {
          const filename = `${projectSlug}/audio/scene-${scene.id}-${line.character.toLowerCase().replace(/\s+/g, '-')}.mp3`;

          const existing = await this.assetService.findByProjectAndScene(
            projectId,
            String(scene.id),
            'AUDIO',
          );
          if (existing) {
            await this.assetService.delete(existing._id?.toString() ?? '');
          }

          let audioBuffer: Buffer;
          let duration = this.estimateDuration(line.text);

          const voice = this.getVoiceForCharacter(line.character, voices);
          const ttsResult = await this.callTTS(line.text, voice, line.emotion);
          if (ttsResult) {
            audioBuffer = ttsResult.buffer;
            duration = ttsResult.duration;
          } else {
            audioBuffer = this.generateSilentAudio(duration);
          }

          const gridfsId = await this.gridfs.uploadFile(filename, audioBuffer, {
            projectId,
            sceneId: scene.id,
            character: line.character,
            emotion: line.emotion,
          });

          const asset = await this.assetService.create({
            projectId,
            sceneId: String(scene.id),
            type: 'AUDIO',
            filename: `${scene.id}-${line.character.toLowerCase().replace(/\s+/g, '-')}.mp3`,
            path: `gridfs:${gridfsId}`,
            url: filename,
            duration,
            provider: 'huggingface-tts',
            model: 'mms-tts',
            metadata: {
              character: line.character,
              text: line.text,
              emotion: line.emotion,
              language,
              gridfsId,
            },
          });

          await this.assetService.update(asset._id?.toString() ?? '', {
            status: 'ready',
          });

          results.push({
            sceneId: String(scene.id),
            character: line.character,
            text: line.text,
            emotion: line.emotion,
            audioAssetId: asset._id?.toString() ?? '',
            duration,
            status: 'ready',
          });

          totalDuration += duration;
        } catch (e) {
          const error = e as Error;
          this.logger.warn(
            `Failed to generate voice for scene ${scene.id}, character ${line.character}: ${error.message}`,
          );
          results.push({
            sceneId: String(scene.id),
            character: line.character,
            text: line.text,
            emotion: line.emotion,
            audioAssetId: '',
            duration: this.estimateDuration(line.text),
            status: 'error',
            errorMessage: error.message,
          });
        }
      }
    }

    await this.pipelineState.setStatus(
      projectId,
      'voice-generation',
      'completed',
    );
    await this.pipelineState.addLog(projectId, 'voice-generation', {
      timestamp: new Date(),
      level: 'info',
      message: `Voice generation completed for ${results.length} lines`,
    });

    return { lines: results, totalDuration };
  }

  private async callTTS(
    text: string,
    voice: string,
    emotion: string,
  ): Promise<{ buffer: Buffer; duration: number } | null> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tts-'));
    const outFile = path.join(tmpDir, 'output.mp3');

    try {
      await execFileAsync(
        'edge-tts',
        ['--voice', voice, '--text', text, '--write-media', outFile],
        { timeout: 30000 },
      );

      const buffer = await fs.readFile(outFile);
      let duration = await this.getAudioDuration(outFile);
      if (duration <= 0) {
        duration = this.estimateDuration(text);
      }
      return { buffer, duration };
    } catch (e) {
      this.logger.warn(`TTS call failed: ${(e as Error).message}`);
      return null;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private getVoiceForCharacter(character: string, voices: string[]): string {
    if (!this.characterVoiceMap.has(character)) {
      this.characterVoiceMap.set(
        character,
        voices[this.voiceIndex % voices.length],
      );
      this.voiceIndex++;
    }
    return this.characterVoiceMap.get(character)!;
  }

  private async getAudioDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execFileAsync(
        'ffprobe',
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          filePath,
        ],
        { timeout: 10000 },
      );
      const duration = parseFloat(stdout.trim());
      if (!isNaN(duration) && duration > 0) {
        return duration;
      }
    } catch {
      this.logger.warn(
        'ffprobe duration measurement failed, falling back to estimate',
      );
    }
    return 0;
  }

  private generateSilentAudio(durationSeconds: number): Buffer {
    const sampleRate = 16000;
    const numSamples = Math.floor(sampleRate * durationSeconds);
    const header = Buffer.alloc(44);
    const dataSize = numSamples * 2;
    const fileSize = dataSize + 36;

    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    const silentData = Buffer.alloc(numSamples * 2, 0);
    return Buffer.concat([header, silentData]);
  }

  private estimateDuration(text: string): number {
    const wordsPerSecond = 3;
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, wordCount / wordsPerSecond);
  }
}

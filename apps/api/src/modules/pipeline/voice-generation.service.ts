import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Inject } from '@nestjs/common';
import { PROVIDER_REGISTRY } from '../provider/provider.module';
import { ProviderRegistry } from '@phoenix/providers';
import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { GridFsService } from '../../common/storage/gridfs.service';
import { FfmpegProcessService } from '../../common/rendering/ffmpeg-process.service';

const execFileAsync = promisify(execFile);

export interface VoiceLineResult {
  sceneId: string;
  character: string;
  text: string;
  emotion: string;
  audioAssetId: string;
  duration: number;
  startTime?: number;
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

interface GenderedVoice {
  voice: string;
  gender: 'male' | 'female';
}

interface ParlerBatchLine {
  id: string;
  text: string;
  style: string;
}

interface ParlerBatchResult {
  success: boolean;
  files: Array<{
    id: string;
    path: string;
    duration: number;
    sample_rate: number;
    error?: string;
  }>;
}

@Injectable()
export class VoiceGenerationService {
  private readonly logger = new Logger(VoiceGenerationService.name);

  private readonly englishMaleVoices: GenderedVoice[] = [
    { voice: 'en-US-GuyNeural', gender: 'male' },
    { voice: 'en-US-DavisNeural', gender: 'male' },
    { voice: 'en-US-TonyNeural', gender: 'male' },
    { voice: 'en-US-AndrewNeural', gender: 'male' },
  ];

  private readonly englishFemaleVoices: GenderedVoice[] = [
    { voice: 'en-US-JennyNeural', gender: 'female' },
    { voice: 'en-US-AriaNeural', gender: 'female' },
    { voice: 'en-US-SaraNeural', gender: 'female' },
    { voice: 'en-US-NancyNeural', gender: 'female' },
  ];

  private readonly hindiMaleVoices: GenderedVoice[] = [
    { voice: 'hi-IN-MadhurNeural', gender: 'male' },
  ];

  private readonly hindiFemaleVoices: GenderedVoice[] = [
    { voice: 'hi-IN-SwaraNeural', gender: 'female' },
  ];

  private readonly COMEDY_PAUSES: Record<string, number> = {
    opening: 0.0,
    reaction: 0.15,
    buildup: 0.0,
    punchline: 0.25,
    exit: 0.1,
  };

  private readonly PARLER_MALE_VOICES = ['Rohit', 'Aman'];
  private readonly PARLER_FEMALE_VOICES = ['Divya', 'Rani'];

  private readonly EMOTION_STYLE_MAP: Record<string, string> = {
    overjoyed:
      'lively, energetic, and animated pure Hindi comedy style with playful excitement and joyful enthusiasm',
    smug: 'smug, overconfident pure Hindi comedy tone with dramatic swagger, witty sarcasm, and playful arrogance',
    panicked:
      'fast-paced, flustered pure Hindi comedy style with high-energy panic, rushed delivery, and comic desperation',
    terrified:
      'scared, trembling pure Hindi comedy tone with exaggerated fear, comic desperation, and dramatic anxiety',
    neutral:
      'natural, clear, and pleasant pure Hindi conversation style with smooth relaxed delivery and warm tone',
    happy:
      'bright, cheerful pure Hindi comedy style with warm energy, joyful enthusiasm, and lively animation',
    sad: 'soft, dramatic pure Hindi comedy tone with over-the-top sadness, comic despair, and melodramatic flair',
    angry:
      'frustrated, intense pure Hindi comedy style with exaggerated anger, loud dramatic outbursts, and comic fury',
    sarcastic:
      'sarcastic, teasing pure Hindi comedy tone with dry wit, playful mockery, and clever comedic timing',
  };

  private readonly TIMING_STYLE_MAP: Record<string, string> = {
    opening:
      'steady conversational pace with clear pure Hindi enunciation, natural rhythm, and smooth delivery',
    reaction:
      'quick surprised reaction with sharp pure Hindi comedy timing, instantaneous delivery, and sudden emphasis',
    buildup:
      'building intensity with slower deliberate pure Hindi pace creating anticipation, suspense, and dramatic tension',
    punchline:
      'rapid-fire punchy pure Hindi delivery emphasizing the comedic climax with crisp timing and strong impact',
    exit: 'trailing off pure Hindi delivery with softer fading tone, creating comedic relief and smooth closure',
  };

  private characterVoiceAssignment = new Map<
    string,
    { voice: string; gender: 'male' | 'female' }
  >();
  private maleVoiceIndex = 0;
  private femaleVoiceIndex = 0;

  private parlerCharacterVoice = new Map<string, string>();
  private parlerMaleIndex = 0;
  private parlerFemaleIndex = 0;

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
    private readonly assetService: AssetService,
    private readonly pipelineState: PipelineStateService,
    private readonly gridfs: GridFsService,
    private readonly ffmpeg: FfmpegProcessService,
  ) {}

  async generateVoice(
    input: VoiceGenerationInput,
  ): Promise<VoiceGenerationResult> {
    const { projectId, projectSlug, language, scenes } = input;
    const results: VoiceLineResult[] = [];
    let totalDuration = 0;

    this.characterVoiceAssignment.clear();
    this.maleVoiceIndex = 0;
    this.femaleVoiceIndex = 0;
    this.parlerCharacterVoice.clear();
    this.parlerMaleIndex = 0;
    this.parlerFemaleIndex = 0;

    const isHindi =
      language.toLowerCase().includes('hindi') ||
      language.toLowerCase().includes('hi');

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

    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'voice-gen-'));

    try {
      const usarParlante = isHindi && (await this.parlerAvailable());

      if (usarParlante) {
        await this.pipelineState.addLog(projectId, 'voice-generation', {
          timestamp: new Date(),
          level: 'info',
          message: 'Using Indic Parler-TTS engine',
        });
        await this.generateVoiceParler(
          scenes,
          projectId,
          projectSlug,
          language,
          isHindi,
          results,
          tmpDir,
        );
      } else {
        await this.generateVoiceEdgeTts(
          scenes,
          projectId,
          projectSlug,
          language,
          isHindi,
          results,
          tmpDir,
        );
      }

      totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }

    const failedLines = results.filter((line) => line.status === 'error');
    if (failedLines.length > 0) {
      const failedSceneIds = [
        ...new Set(failedLines.map((line) => line.sceneId)),
      ];
      const message = `Voice generation failed for ${failedLines.length} line(s) in scene(s): ${failedSceneIds.join(', ')}.`;
      await this.pipelineState.setStatus(
        projectId,
        'voice-generation',
        'failed',
      );
      await this.pipelineState.addLog(projectId, 'voice-generation', {
        timestamp: new Date(),
        level: 'error',
        message,
      });
      throw new InternalServerErrorException(message);
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

  private async generateVoiceEdgeTts(
    scenes: VoiceGenerationInput['scenes'],
    projectId: string,
    projectSlug: string,
    language: string,
    isHindi: boolean,
    results: VoiceLineResult[],
    tmpDir: string,
  ): Promise<void> {
    for (const scene of scenes) {
      const lineBuffers: Array<{ buffer: Buffer; duration: number }> = [];

      let lineIndex = 0;
      for (const line of scene.dialogue) {
        lineIndex++;
        try {
          const assigned = this.getVoiceForCharacter(line.character, isHindi);
          const pauseDuration = this.COMEDY_PAUSES[line.timing] ?? 0;

          const ttsResult = await this.callTTS(
            line.text,
            assigned.voice,
            line.emotion,
          );

          let audioBuffer: Buffer;
          let duration: number;

          if (ttsResult) {
            const converted = await this.convertMp3ToWav(
              ttsResult.buffer,
              pauseDuration,
              tmpDir,
              scene.id,
              lineIndex,
            );
            audioBuffer = converted.buffer;
            duration = converted.duration || ttsResult.duration + pauseDuration;
          } else {
            duration = this.estimateDuration(line.text) + pauseDuration;
            audioBuffer = this.generateSilentAudio(duration);
          }

          lineBuffers.push({ buffer: audioBuffer, duration });

          results.push({
            sceneId: String(scene.id),
            character: line.character,
            text: line.text,
            emotion: line.emotion,
            audioAssetId: '',
            duration,
            status: 'ready',
          });
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

      if (lineBuffers.length === 0) continue;

      await this.saveSceneAudio(
        lineBuffers,
        scene.id,
        projectId,
        projectSlug,
        language,
        results,
        'edge-tts',
        'edge-neural',
        tmpDir,
      );
    }
  }

  private async generateVoiceParler(
    scenes: VoiceGenerationInput['scenes'],
    projectId: string,
    projectSlug: string,
    language: string,
    isHindi: boolean,
    results: VoiceLineResult[],
    tmpDir: string,
  ): Promise<void> {
    const batchLines: ParlerBatchLine[] = [];
    const lineKeyToMeta = new Map<
      string,
      {
        sceneId: number;
        lineIndex: number;
        character: string;
        text: string;
        emotion: string;
        timing: string;
      }
    >();

    let globalLineIndex = 0;
    for (const scene of scenes) {
      for (let li = 0; li < scene.dialogue.length; li++) {
        const line = scene.dialogue[li];
        const style = this.buildParlerStyle(
          line.character,
          line.emotion,
          line.timing,
          isHindi,
        );
        const lineId = `s${scene.id}l${li}`;
        batchLines.push({ id: lineId, text: line.text, style });
        lineKeyToMeta.set(lineId, {
          sceneId: scene.id,
          lineIndex: li,
          character: line.character,
          text: line.text,
          emotion: line.emotion,
          timing: line.timing,
        });
      }
    }

    if (batchLines.length === 0) return;

    const parlerOutDir = path.join(tmpDir, 'parler-out');
    await fsp.mkdir(parlerOutDir, { recursive: true });

    let parlerResults: Map<string, { path: string; duration: number }>;

    try {
      parlerResults = await this.callParlerTTSBatch(batchLines, parlerOutDir);
    } catch (e) {
      const error = e as Error;
      this.logger.error(
        `Indic Parler-TTS batch failed: ${error.message}. Falling back to edge-tts.`,
      );
      await this.pipelineState.addLog(projectId, 'voice-generation', {
        timestamp: new Date(),
        level: 'warn',
        message: `Parler-TTS failed (${error.message}), falling back to edge-tts`,
      });
      await this.generateVoiceEdgeTts(
        scenes,
        projectId,
        projectSlug,
        language,
        isHindi,
        results,
        tmpDir,
      );
      return;
    }

    for (const scene of scenes) {
      const lineBuffers: Array<{ buffer: Buffer; duration: number }> = [];

      for (let li = 0; li < scene.dialogue.length; li++) {
        const line = scene.dialogue[li];
        const lineId = `s${scene.id}l${li}`;
        const meta = lineKeyToMeta.get(lineId)!;
        const parleResult = parlerResults.get(lineId);

        const pauseDuration = this.COMEDY_PAUSES[line.timing] ?? 0;

        try {
          let audioBuffer: Buffer;
          let duration: number;

          if (parleResult && parleResult.path) {
            const outWav = path.join(tmpDir, `parler-${lineId}.wav`);
            audioBuffer = await this.applyPauseToWav(
              parleResult.path,
              pauseDuration,
              outWav,
            );
            duration = parleResult.duration + pauseDuration;
          } else {
            duration = this.estimateDuration(line.text) + pauseDuration;
            audioBuffer = this.generateSilentAudio(duration);
          }

          lineBuffers.push({ buffer: audioBuffer, duration });

          results.push({
            sceneId: String(scene.id),
            character: meta.character,
            text: meta.text,
            emotion: meta.emotion,
            audioAssetId: '',
            duration,
            status: 'ready',
          });
        } catch (e) {
          const error = e as Error;
          this.logger.warn(
            `Parler-TTS line ${lineId} failed: ${error.message}`,
          );
          const duration = this.estimateDuration(line.text) + pauseDuration;
          results.push({
            sceneId: String(scene.id),
            character: meta.character,
            text: meta.text,
            emotion: meta.emotion,
            audioAssetId: '',
            duration,
            status: 'error',
            errorMessage: error.message,
          });
        }
      }

      if (lineBuffers.length === 0) continue;

      await this.saveSceneAudio(
        lineBuffers,
        scene.id,
        projectId,
        projectSlug,
        language,
        results,
        'indic-parler-tts',
        'ai4bharat/indic-parler-tts',
        tmpDir,
      );
    }
  }

  private async saveSceneAudio(
    lineBuffers: Array<{ buffer: Buffer; duration: number }>,
    sceneId: number,
    projectId: string,
    projectSlug: string,
    language: string,
    results: VoiceLineResult[],
    provider: string,
    model: string,
    mergeTmpDir?: string,
  ): Promise<void> {
    const mergeDir =
      mergeTmpDir || `/tmp/phoenix-merge-${projectSlug || projectId}`;
    await fsp.mkdir(mergeDir, { recursive: true });
    const mergedBuffer = await this.mergeAudioBuffers(
      lineBuffers,
      mergeDir,
      sceneId,
    );

    const existing = await this.assetService.findByProjectAndScene(
      projectId,
      String(sceneId),
      'AUDIO',
    );
    if (existing) {
      const oldGridfsId = existing.path?.replace('gridfs:', '') ?? '';
      if (oldGridfsId) {
        await this.gridfs.deleteFile(oldGridfsId).catch(() => {});
      }
      await this.assetService.delete(existing._id?.toString() ?? '');
    }

    const filename = `${projectSlug}/audio/scene-${sceneId}.wav`;
    const gridfsId = await this.gridfs.uploadFile(filename, mergedBuffer, {
      projectId,
      sceneId,
      linesCount: lineBuffers.length,
    });

    const sceneDuration = lineBuffers.reduce((sum, b) => sum + b.duration, 0);

    const asset = await this.assetService.create({
      projectId,
      sceneId: String(sceneId),
      type: 'AUDIO',
      filename: `scene-${sceneId}.wav`,
      path: `gridfs:${gridfsId}`,
      url: filename,
      duration: sceneDuration,
      provider,
      model,
      metadata: {
        linesCount: lineBuffers.length,
        language,
        gridfsId,
      },
    });

    await this.assetService.update(asset._id?.toString() ?? '', {
      status: 'ready',
    });

    const sceneResults = results.filter(
      (r) => r.sceneId === String(sceneId) && r.status === 'ready',
    );
    for (const r of sceneResults) {
      r.audioAssetId = asset._id?.toString() ?? '';
    }
  }

  private async mergeAudioBuffers(
    buffers: Array<{ buffer: Buffer; duration: number }>,
    tmpDir: string,
    sceneId: number,
  ): Promise<Buffer> {
    if (buffers.length === 1) {
      return buffers[0].buffer;
    }

    const partFiles: string[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const partPath = path.join(tmpDir, `merge-${sceneId}-part-${i}.wav`);
      await fsp.writeFile(partPath, buffers[i].buffer);
      partFiles.push(partPath);
    }

    const concatList = path.join(tmpDir, `merge-${sceneId}-concat.txt`);
    const content = partFiles.map((f) => `file '${f}'`).join('\n');
    await fsp.writeFile(concatList, content);

    const mergedPath = path.join(tmpDir, `merge-${sceneId}-merged.wav`);
    await this.ffmpeg.run(
      [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatList,
        '-c',
        'copy',
        mergedPath,
      ],
      `merge audio scene ${sceneId}`,
    );

    const mergedBuffer = await fsp.readFile(mergedPath);

    for (const f of partFiles) {
      await fsp.rm(f, { force: true }).catch(() => {});
    }
    await fsp.rm(concatList, { force: true }).catch(() => {});
    await fsp.rm(mergedPath, { force: true }).catch(() => {});

    return mergedBuffer;
  }

  private async callTTS(
    text: string,
    voice: string,
    emotion: string,
  ): Promise<{ buffer: Buffer; duration: number } | null> {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'tts-'));
    const outFile = path.join(tmpDir, 'output.mp3');

    try {
      await execFileAsync(
        'edge-tts',
        ['--voice', voice, '--text', text, '--write-media', outFile],
        { timeout: 30000 },
      );

      const buffer = await fsp.readFile(outFile);
      let duration = await this.getAudioDuration(outFile);
      if (duration <= 0) {
        duration = this.estimateDuration(text);
      }
      return { buffer, duration };
    } catch (e) {
      const sanitized = text.replace(/[^\w\s\u0900-\u097F.,!?]/g, '').trim();
      if (sanitized && sanitized !== text && sanitized.length > 0) {
        this.logger.warn(
          `TTS failed for original text, retrying sanitized: "${text}" -> "${sanitized}"`,
        );
        try {
          await execFileAsync(
            'edge-tts',
            ['--voice', voice, '--text', sanitized, '--write-media', outFile],
            { timeout: 30000 },
          );
          const buffer = await fsp.readFile(outFile);
          let duration = await this.getAudioDuration(outFile);
          if (duration <= 0) {
            duration = this.estimateDuration(sanitized);
          }
          return { buffer, duration };
        } catch (e2) {
          this.logger.warn(
            `TTS retry also failed for "${sanitized}": ${(e2 as Error).message}`,
          );
        }
      } else {
        this.logger.warn(
          `TTS failed for text "${text}" with voice ${voice}: ${(e as Error).message}`,
        );
      }
      return null;
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private getVoiceForCharacter(
    character: string,
    isHindi: boolean,
  ): { voice: string; gender: 'male' | 'female' } {
    if (this.characterVoiceAssignment.has(character)) {
      return this.characterVoiceAssignment.get(character)!;
    }

    const isMale = this.isMaleCharacter(character);
    const gender: 'male' | 'female' = isMale ? 'male' : 'female';

    let voice: string;
    if (isHindi) {
      if (isMale) {
        const voices = this.hindiMaleVoices;
        voice =
          voices[this.maleVoiceIndex % voices.length]?.voice ??
          'hi-IN-MadhurNeural';
        this.maleVoiceIndex++;
      } else {
        const voices = this.hindiFemaleVoices;
        voice =
          voices[this.femaleVoiceIndex % voices.length]?.voice ??
          'hi-IN-SwaraNeural';
        this.femaleVoiceIndex++;
      }
    } else {
      if (isMale) {
        const voices = this.englishMaleVoices;
        voice =
          voices[this.maleVoiceIndex % voices.length]?.voice ??
          'en-US-GuyNeural';
        this.maleVoiceIndex++;
      } else {
        const voices = this.englishFemaleVoices;
        voice =
          voices[this.femaleVoiceIndex % voices.length]?.voice ??
          'en-US-JennyNeural';
        this.femaleVoiceIndex++;
      }
    }

    const assignment = { voice, gender };
    this.characterVoiceAssignment.set(character, assignment);
    return assignment;
  }

  private getParlerVoiceForCharacter(character: string): string {
    const cached = this.parlerCharacterVoice.get(character);
    if (cached) return cached;

    const isMale = this.isMaleCharacter(character);
    let voice: string;
    if (isMale) {
      const voices = this.PARLER_MALE_VOICES;
      voice = voices[this.parlerMaleIndex % voices.length];
      this.parlerMaleIndex++;
    } else {
      const voices = this.PARLER_FEMALE_VOICES;
      voice = voices[this.parlerFemaleIndex % voices.length];
      this.parlerFemaleIndex++;
    }

    this.parlerCharacterVoice.set(character, voice);
    return voice;
  }

  private buildParlerStyle(
    character: string,
    emotion: string,
    timing: string,
    isHindi: boolean,
  ): string {
    const voice = this.getParlerVoiceForCharacter(character);
    const emotionStyle =
      this.EMOTION_STYLE_MAP[emotion] || 'natural Hindi conversation style';
    const timingStyle =
      this.TIMING_STYLE_MAP[timing] || 'natural conversational pace';

    return `${voice} speaks Hindi with a ${emotionStyle} and ${timingStyle}. The voice is very clear with excellent recording quality, pure Hindi delivery, natural Indian accent, and no background noise.`;
  }

  private async callParlerTTSBatch(
    lines: ParlerBatchLine[],
    outputDir: string,
  ): Promise<Map<string, { path: string; duration: number }>> {
    const batchInput = { lines };
    const batchFile = path.join(outputDir, 'batch-input.json');
    await fsp.writeFile(batchFile, JSON.stringify(batchInput));

    const scriptPath = this.findParlerScript();

    const { stdout, stderr } = await execFileAsync(
      'python3',
      [scriptPath, '--input', batchFile, '--output-dir', outputDir],
      { timeout: 600000, maxBuffer: 10 * 1024 * 1024 },
    );

    if (stderr) {
      this.logger.log(`Parler-TTS stderr: ${stderr}`);
    }

    const result: ParlerBatchResult = JSON.parse(stdout);

    if (!result.success) {
      throw new Error(`Parler-TTS batch failed`);
    }

    const results = new Map<string, { path: string; duration: number }>();
    for (const file of result.files) {
      results.set(file.id, { path: file.path, duration: file.duration });
    }
    return results;
  }

  private findParlerScript(): string {
    const root = path.resolve(__dirname, '..', '..', '..', '..', '..');
    const candidates = [
      path.join(root, 'scripts', 'indic_parler_tts.py'),
      path.join(process.cwd(), 'scripts', 'indic_parler_tts.py'),
      'scripts/indic_parler_tts.py',
    ];
    for (const c of candidates) {
      try {
        fs.accessSync(c);
        return c;
      } catch {
        continue;
      }
    }
    return 'scripts/indic_parler_tts.py';
  }

  private async parlerAvailable(): Promise<boolean> {
    try {
      const scriptPath = this.findParlerScript();
      fs.accessSync(scriptPath);
    } catch {
      return false;
    }
    try {
      const { stdout } = await execFileAsync(
        'python3',
        [
          '-c',
          'import importlib.metadata; importlib.metadata.version("parler_tts"); print("ok")',
        ],
        { timeout: 8000 },
      );
      return stdout.trim() === 'ok';
    } catch {
      return false;
    }
  }

  private async applyPauseToWav(
    inputWavPath: string,
    pauseDuration: number,
    outputWavPath: string,
  ): Promise<Buffer> {
    if (pauseDuration <= 0) {
      return fsp.readFile(inputWavPath);
    }

    const pauseMs = Math.round(pauseDuration * 1000);
    await this.ffmpeg.run(
      [
        '-y',
        '-i',
        inputWavPath,
        '-af',
        `adelay=${pauseMs}:all=1`,
        '-ar',
        '44100',
        '-ac',
        '1',
        '-c:a',
        'pcm_s16le',
        outputWavPath,
      ],
      `apply pause ${pauseDuration}s to wav`,
    );

    return fsp.readFile(outputWavPath);
  }

  private isMaleCharacter(name: string): boolean {
    const n = name.toLowerCase();
    const femaleIndicators = [
      'mrs',
      'ms',
      'miss',
      'aunty',
      'mom',
      'mother',
      'wife',
      'sister',
      'girl',
      'lady',
      'woman',
      'bhabhi',
      'didi',
      'beti',
    ];
    return !femaleIndicators.some((indicator) => n.includes(indicator));
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

  private async convertMp3ToWav(
    mp3Buffer: Buffer,
    pauseDuration: number,
    tmpDir: string,
    sceneId: number,
    lineIndex: number,
  ): Promise<{ buffer: Buffer; duration: number }> {
    const inputMp3Path = path.join(
      tmpDir,
      `scene-${sceneId}-line-${lineIndex}-raw.mp3`,
    );
    const outputWavPath = path.join(
      tmpDir,
      `scene-${sceneId}-line-${lineIndex}.wav`,
    );

    await fsp.writeFile(inputMp3Path, mp3Buffer);

    const ffmpegArgs: string[] = ['-y', '-i', inputMp3Path];
    if (pauseDuration > 0) {
      const pauseMs = Math.round(pauseDuration * 1000);
      ffmpegArgs.push('-af', `adelay=${pauseMs}:all=1`);
    }
    ffmpegArgs.push(
      '-ar',
      '44100',
      '-ac',
      '1',
      '-c:a',
      'pcm_s16le',
      outputWavPath,
    );

    await this.ffmpeg.run(
      ffmpegArgs,
      `convert tts mp3 to wav scene ${sceneId} line ${lineIndex}`,
    );

    const buffer = await fsp.readFile(outputWavPath);
    let duration = await this.getAudioDuration(outputWavPath);
    if (duration <= 0) {
      duration = 0;
    }

    await fsp.rm(inputMp3Path, { force: true }).catch(() => {});
    await fsp.rm(outputWavPath, { force: true }).catch(() => {});

    return { buffer, duration };
  }

  private generateSilentAudio(durationSeconds: number): Buffer {
    const sampleRate = 44100;
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

import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { VoiceInput, VoiceOutput, VoiceLine } from './voice.types';
import { PROVIDER_REGISTRY } from '../../../provider/provider.module';
import { ProviderRegistry } from '@phoenix/providers';

@Injectable()
export class VoiceAgent {
  private readonly logger = new Logger(VoiceAgent.name);

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
  ) {}

  async execute(input: VoiceInput): Promise<VoiceOutput> {
    this.logger.log(
      `Preparing voice plan for ${input.dialogues.scenes.length} scenes`,
    );

    const mediaProvider = this.registry.getMediaProvider();

    const generated: VoiceLine[] = [];

    for (const scene of input.dialogues.scenes) {
      for (const line of scene.dialogue) {
        let audioPath = `audio/${scene.id}-${line.character.toLowerCase().replace(/\s+/g, '-')}.mp3`;
        let duration = line.text.length * 0.1; // Default estimate

        // Try to use real media provider if available
        if (mediaProvider) {
          try {
            const audioResult = await mediaProvider.generateAudio({
              text: line.text,
              emotion: line.emotion,
              language: input.project.language,
            });
            audioPath = audioResult.audioPath;
            duration = audioResult.duration;
          } catch (e) {
            const error = e as Error;
            this.logger.warn(
              `Media provider failed, using fallback: ${error.message}`,
            );
          }
        }

        generated.push({
          sceneId: String(scene.id),
          character: line.character,
          text: line.text,
          emotion: line.emotion,
          audioPath,
          duration,
          status: 'ready' as const,
        });
      }
    }

    const output: VoiceOutput = {
      scenes: generated,
      status: 'ready',
      generatedAt: new Date().toISOString(),
    };

    this.logger.log(`Voice plan prepared for ${generated.length} lines`);
    return output;
  }
}

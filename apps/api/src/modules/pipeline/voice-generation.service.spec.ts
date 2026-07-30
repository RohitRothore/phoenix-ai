import { Test } from '@nestjs/testing';
import { VoiceGenerationService } from './voice-generation.service';
import { PROVIDER_REGISTRY } from '../provider/provider.module';
import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { GridFsService } from '../../common/storage/gridfs.service';
import { FfmpegProcessService } from '../../common/rendering/ffmpeg-process.service';

describe('VoiceGenerationService', () => {
  let service: VoiceGenerationService;

  const mockProviderRegistry = {
    get: jest.fn(),
    getMediaProvider: jest.fn(),
  };

  const mockAssetService = {
    findByProjectAndScene: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ _id: 'asset-1' }),
    update: jest.fn().mockResolvedValue({ _id: 'asset-1' }),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const mockPipelineStateService = {
    setStatus: jest.fn().mockResolvedValue(undefined),
    addLog: jest.fn().mockResolvedValue(undefined),
  };

  const mockGridFsService = {
    uploadFile: jest.fn().mockResolvedValue('gridfs-1'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockFfmpegProcessService = {
    run: jest.fn().mockImplementation(async (args: string[]) => {
      // Mock ffmpeg output file creation
      const fs = require('fs/promises');
      const outPath = args[args.length - 1];
      if (outPath.endsWith('.wav')) {
        // Create dummy wav buffer
        const header = Buffer.alloc(44);
        header.write('RIFF', 0);
        header.writeUInt32LE(36, 4);
        header.write('WAVE', 8);
        await fs.writeFile(outPath, header);
      }
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        VoiceGenerationService,
        { provide: PROVIDER_REGISTRY, useValue: mockProviderRegistry },
        { provide: AssetService, useValue: mockAssetService },
        { provide: PipelineStateService, useValue: mockPipelineStateService },
        { provide: GridFsService, useValue: mockGridFsService },
        { provide: FfmpegProcessService, useValue: mockFfmpegProcessService },
      ],
    }).compile();

    service = moduleRef.get<VoiceGenerationService>(VoiceGenerationService);
    jest.spyOn(service as any, 'parlerAvailable').mockResolvedValue(false);
  });

  it('should generate voice lines for all dialogues in all scenes', async () => {
    // Mock callTTS by replacing private method or using real fallback
    jest
      .spyOn(service as any, 'callTTS')
      .mockImplementation(async (text: string) => {
        return {
          buffer: Buffer.from('mock-mp3-data'),
          duration: 2.0,
        };
      });

    jest.spyOn(service as any, 'getAudioDuration').mockResolvedValue(2.25);

    const input = {
      projectId: 'proj-123',
      projectSlug: 'pappu-test',
      language: 'Hindi',
      scenes: [
        {
          id: 1,
          duration: 5,
          dialogue: [
            {
              character: 'Rahul',
              text: 'Aha! Apun hi aaj is duniya ka bhagwan hai!',
              emotion: 'overjoyed',
              timing: 'opening',
            },
            {
              character: 'Rahul',
              text: 'Ambani ko call lagao, business deal cancel karni hai!',
              emotion: 'smug',
              timing: 'punchline',
            },
          ],
        },
        {
          id: 2,
          duration: 5,
          dialogue: [
            {
              character: 'Rahul',
              text: 'Arey! Kaun ho tum log? Mera taj chhod!',
              emotion: 'panicked',
              timing: 'opening',
            },
            {
              character: 'Rahul',
              text: 'Arre Rent wale uncle, please... agle mahine pakka!',
              emotion: 'terrified',
              timing: 'punchline',
            },
          ],
        },
      ],
    };

    const result = await service.generateVoice(input);

    expect(result.lines).toHaveLength(4);
    expect(result.lines[0].text).toContain('Apun hi aaj');
    expect(result.lines[1].text).toContain('Ambani ko call');
    expect(result.lines[2].text).toContain('Kaun ho tum log');
    expect(result.lines[3].text).toContain('Rent wale uncle');
    expect(mockGridFsService.uploadFile).toHaveBeenCalledTimes(2);
    expect(mockAssetService.create).toHaveBeenCalledTimes(2);
  });
});

import { Test } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { LocalStorageService } from '../../common/storage/local-storage.service';
import { DirectorAgent } from '../ai/agents/director/director.agent';
import { StoryAgent } from '../ai/agents/story/story.agent';
import { SceneAgent } from '../ai/agents/scene/scene.agent';
import { DialogueAgent } from '../ai/agents/dialogue/dialogue.agent';
import { PromptAgent } from '../ai/agents/prompt/prompt.agent';
import { VideoPreparationPipeline } from '../ai/pipelines/video-preparation.pipeline';
import { LocalFfmpegVideoRendererService } from '../../common/rendering/local-ffmpeg-video-renderer.service';
import { LocalFfmpegExportService } from '../../common/rendering/local-ffmpeg-export.service';
import { SubtitlePipeline } from '../ai/pipelines/subtitle.pipeline';
import { MongoDBProjectService } from '../../common/storage/mongodb-project.service';
import { ImageGenerationService } from '../pipeline/image-generation.service';
import { PromptEnhancerService } from '../pipeline/prompt-enhancer.service';
import { SceneRendererService } from '../pipeline/scene-renderer.service';
import { VoiceGenerationService } from '../pipeline/voice-generation.service';
import { CompositionService } from '../pipeline/composition.service';
import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from '../pipeline/pipeline-state.service';
import { GenerationQueueService } from '../pipeline/generation-queue.service';
import { GridFsService } from '../../common/storage/gridfs.service';

describe('ProjectsService', () => {
  const mockDirectorAgent = {
    execute: jest.fn().mockResolvedValue({
      genre: 'Comedy',
      targetAudience: '18-35',
      tone: 'Sarcastic',
      pacing: 'Fast',
      storyStructure: ['Hook', 'Setup', 'Conflict', 'Punchline'],
      visualStyle: 'Pixar',
      comedyMechanics: ['Situational comedy', 'Relatable characters'],
      contentGuidelines: 'Family-friendly comedy',
    }),
  };

  const mockStoryAgent = {
    execute: jest.fn().mockResolvedValue({
      title: 'Pappu IT Office',
      hook: 'Funny hook',
      premise: 'Pappu works in IT',
      summary: 'A funny summary',
      acts: [{ name: 'Setup', description: 'Pappu starts work' }],
      comedyBeat: 'Lazy work',
      ending: 'Payoff lands',
      characters: [{ name: 'Pappu', role: 'protagonist', personality: 'Lazy' }],
    }),
  };

  const mockSceneAgent = {
    execute: jest.fn().mockResolvedValue({
      scenes: [
        {
          id: 1,
          title: 'Intro',
          act: 'Setup',
          duration: 10,
          description: 'Pappu sleeps at desk',
          dialogue: 'Hey Pappu!',
          visualPrompt: 'Cartoon of a lazy office worker',
          comedyElement: 'Snores loudly',
        },
      ],
    }),
  };

  const mockDialogueAgent = {
    execute: jest.fn().mockResolvedValue({
      scenes: [
        {
          id: 1,
          dialogue: [
            {
              character: 'Pappu',
              text: 'Hey Pappu!',
              emotion: 'sarcastic',
              timing: 'opening',
            },
          ],
        },
      ],
    }),
  };

  const mockPromptAgent = {
    execute: jest.fn().mockResolvedValue({
      promptVersion: '1.0.0',
      scenes: [
        {
          id: 1,
          duration: 8,
          prompt: 'Office scene',
          negativePrompt: 'No text',
          camera: 'Medium shot',
          lighting: 'Warm',
          mood: 'Playful',
          status: 'pending',
        },
      ],
      status: 'pending',
      generatedAt: '2026-07-20T00:00:00.000Z',
      resolution: '1080x1920',
      frameRate: 30,
    }),
  };

  const mockVideoPreparationPipeline = {
    run: jest.fn().mockResolvedValue({
      scenes: [
        {
          id: 1,
          duration: 8,
          prompt: 'Office scene',
          negativePrompt: 'No text',
          camera: 'Medium shot',
          lighting: 'Warm',
          mood: 'Playful',
          status: 'pending',
        },
      ],
      status: 'pending',
      generatedAt: '2026-07-20T00:00:00.000Z',
      resolution: '1080x1920',
      frameRate: 30,
    }),
  };

  const mockLocalVideoRenderer = {
    render: jest.fn().mockResolvedValue({
      finalPath: 'video/final.mp4',
      duration: 8,
      renderedAt: '2026-07-20T00:00:00.000Z',
    }),
  };

  const mockSubtitlePipeline = {
    run: jest
      .fn()
      .mockResolvedValue({ cues: [], generatedAt: '2026-07-20T00:00:00.000Z' }),
  };
  const mockLocalExportService = {
    export: jest.fn().mockResolvedValue('exports/phoenix-short.mp4'),
  };

  const mockMongo = {
    findBySlug: jest.fn().mockResolvedValue({
      id: 'project-1',
      name: 'Pappu IT Office',
      slug: 'pappu-it-office',
      language: 'Hindi',
      platform: 'YouTube Shorts',
      style: 'Pixar',
      humor: 'Sarcastic',
    }),
    createProject: jest
      .fn()
      .mockImplementation((p) => Promise.resolve({ ...p, id: 'project-1' })),
    updateProject: jest.fn().mockResolvedValue(undefined),
    updateProjectTimestamp: jest.fn().mockResolvedValue(undefined),
    getArtifact: jest.fn(),
    setArtifact: jest.fn().mockResolvedValue(undefined),
  };
  const mockImageGen = {};
  const mockPromptEnhancer = {};
  const mockSceneRenderer = {};
  const mockVoiceGen = {};
  const mockComposition = {};
  const mockAsset = {};
  const mockPipelineState = { setStatus: jest.fn(), addLog: jest.fn() };
  const mockGenQueue = {};
  const mockGridfs = {};

  const commonProviders = [
    ProjectsService,
    { provide: MongoDBProjectService, useValue: mockMongo },
    { provide: ImageGenerationService, useValue: mockImageGen },
    { provide: PromptEnhancerService, useValue: mockPromptEnhancer },
    { provide: SceneRendererService, useValue: mockSceneRenderer },
    { provide: VoiceGenerationService, useValue: mockVoiceGen },
    { provide: CompositionService, useValue: mockComposition },
    { provide: AssetService, useValue: mockAsset },
    { provide: PipelineStateService, useValue: mockPipelineState },
    { provide: GenerationQueueService, useValue: mockGenQueue },
    { provide: GridFsService, useValue: mockGridfs },
    { provide: DirectorAgent, useValue: mockDirectorAgent },
    { provide: StoryAgent, useValue: mockStoryAgent },
    { provide: SceneAgent, useValue: mockSceneAgent },
    { provide: DialogueAgent, useValue: mockDialogueAgent },
    { provide: PromptAgent, useValue: mockPromptAgent },
    {
      provide: VideoPreparationPipeline,
      useValue: mockVideoPreparationPipeline,
    },
    {
      provide: LocalFfmpegVideoRendererService,
      useValue: mockLocalVideoRenderer,
    },
    { provide: SubtitlePipeline, useValue: mockSubtitlePipeline },
    { provide: LocalFfmpegExportService, useValue: mockLocalExportService },
  ];

  it('creates a project directory and returns a project payload', async () => {
    mockMongo.findBySlug.mockResolvedValueOnce(null);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ...commonProviders,
        {
          provide: LocalStorageService,
          useValue: {
            ensureDirectory: jest.fn().mockResolvedValue(undefined),
            writeJson: jest.fn().mockResolvedValue(undefined),
            listDirectories: jest.fn().mockResolvedValue([]),
            readJson: jest.fn().mockResolvedValue({
              id: 'project-1',
              name: 'Pappu IT Office',
              slug: 'pappu-it-office',
              language: 'Hindi',
              platform: 'YouTube Shorts',
              style: 'Pixar',
              humor: 'Sarcastic',
            }),
            exists: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    const result = await service.create({
      name: 'Pappu IT Office',
      language: 'Hindi',
      platform: 'YouTube Shorts',
      style: 'Pixar',
      humor: 'Sarcastic',
    });

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Pappu IT Office');
    expect(result.data.slug).toBe('pappu-it-office');
  });

  it('generates a director plan for an existing project and saves it to storage', async () => {
    const writeJson = jest.fn().mockResolvedValue(undefined);
    const readJson = jest.fn().mockResolvedValue({
      id: 'project-1',
      name: 'Pappu IT Office',
      slug: 'pappu-it-office',
      language: 'Hindi',
      platform: 'YouTube Shorts',
      style: 'Pixar',
      humor: 'Sarcastic',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ...commonProviders,
        {
          provide: LocalStorageService,
          useValue: {
            ensureDirectory: jest.fn().mockResolvedValue(undefined),
            writeJson,
            readJson,
            exists: jest.fn().mockResolvedValue(true),
            listDirectories: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    const result = await service.generateDirectorPlan('pappu-it-office');

    expect(result.success).toBe(true);
  });

  it('generates a story artifact from the saved director plan', async () => {
    mockMongo.getArtifact.mockResolvedValue({
      genre: 'Comedy',
      targetAudience: '18-35',
      tone: 'Sarcastic',
      pacing: 'Fast',
      storyStructure: ['Hook', 'Setup', 'Conflict', 'Punchline'],
      visualStyle: 'Pixar',
      comedyMechanics: ['Situational comedy'],
      contentGuidelines: 'Family-friendly',
      status: 'ready',
    });

    const writeJson = jest.fn().mockResolvedValue(undefined);
    const readJson = jest.fn().mockImplementation(async (path: string) => {
      if (path === 'projects/pappu-it-office/project.json') {
        return {
          id: 'project-1',
          name: 'Pappu IT Office',
          slug: 'pappu-it-office',
          language: 'Hindi',
          platform: 'YouTube Shorts',
          style: 'Pixar',
          humor: 'Sarcastic',
        };
      }

      return {
        genre: 'Comedy',
        targetAudience: '18-35',
        tone: 'Sarcastic',
        pacing: 'Fast',
        storyStructure: ['Hook', 'Setup', 'Conflict', 'Punchline'],
        visualStyle: 'Pixar',
        comedyMechanics: ['Situational comedy'],
        contentGuidelines: 'Family-friendly',
        status: 'ready',
      };
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ...commonProviders,
        {
          provide: LocalStorageService,
          useValue: {
            ensureDirectory: jest.fn().mockResolvedValue(undefined),
            writeJson,
            readJson,
            exists: jest.fn().mockResolvedValue(true),
            listDirectories: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    const result = await service.generateStory('pappu-it-office');

    expect(result.success).toBe(true);
  });

  it('generates scenes from the saved story plan', async () => {
    mockMongo.getArtifact.mockImplementation(async (id: string, name: string) => {
      if (name === 'director') {
        return {
          genre: 'Comedy',
          targetAudience: '18-35',
          tone: 'Sarcastic',
          pacing: 'Fast',
          storyStructure: ['Hook', 'Setup', 'Conflict', 'Punchline'],
          visualStyle: 'Pixar',
          comedyMechanics: ['Situational comedy'],
          contentGuidelines: 'Family-friendly',
          status: 'ready',
        };
      }
      return {
        title: 'Pappu IT Office',
        hook: 'Funny hook',
        premise: 'Pappu works in IT',
        summary: 'A funny summary',
        acts: [{ name: 'Setup', description: 'Pappu starts work' }],
        comedyBeat: 'Lazy work',
        ending: 'Payoff lands',
        characters: [
          { name: 'Pappu', role: 'protagonist', personality: 'Lazy' },
        ],
        status: 'ready',
      };
    });

    const writeJson = jest.fn().mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ...commonProviders,
        {
          provide: LocalStorageService,
          useValue: {
            ensureDirectory: jest.fn().mockResolvedValue(undefined),
            writeJson,
            readJson: jest.fn(),
            exists: jest.fn().mockResolvedValue(true),
            listDirectories: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    const result = await service.generateScenes('pappu-it-office');

    expect(result.success).toBe(true);
  });

  it('generates render prompts from ready project artifacts', async () => {
    mockMongo.getArtifact.mockImplementation(async (id: string, name: string) => {
      if (name === 'director') {
        return {
          genre: 'Comedy',
          targetAudience: '18-35',
          tone: 'Sarcastic',
          pacing: 'Fast',
          storyStructure: ['Hook', 'Setup', 'Conflict', 'Punchline'],
          visualStyle: 'Pixar',
          comedyMechanics: ['Situational comedy'],
          contentGuidelines: 'Family-friendly',
          status: 'ready',
        };
      }
      if (name === 'story') {
        return {
          title: 'Pappu IT Office',
          hook: 'Funny hook',
          premise: 'Pappu works in IT',
          summary: 'A funny summary',
          acts: [{ name: 'Setup', description: 'Pappu starts work' }],
          comedyBeat: 'Lazy work',
          ending: 'Payoff lands',
          characters: [
            { name: 'Pappu', role: 'protagonist', personality: 'Lazy' },
          ],
          status: 'ready',
        };
      }
      if (name === 'scenes') {
        return {
          scenes: [
            {
              id: 1,
              title: 'Intro',
              act: 'Setup',
              duration: 8,
              description: 'Pappu sleeps at desk',
              dialogue: 'Hey Pappu!',
              visualPrompt: 'Cartoon of a lazy office worker',
              comedyElement: 'Snores loudly',
            },
          ],
          status: 'ready',
        };
      }
      if (name === 'dialogues') {
        return {
          scenes: [
            {
              id: 1,
              dialogue: [
                {
                  character: 'Pappu',
                  text: 'Hey Pappu!',
                  emotion: 'sarcastic',
                  timing: 'opening',
                },
              ],
            },
          ],
          generatedAt: '2026-07-20T00:00:00.000Z',
          status: 'ready',
        };
      }
      return null;
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ...commonProviders,
        {
          provide: LocalStorageService,
          useValue: {
            ensureDirectory: jest.fn(),
            writeJson: jest.fn(),
            readJson: jest.fn(),
            exists: jest.fn().mockResolvedValue(true),
            listDirectories: jest.fn(),
          },
        },
      ],
    }).compile();

    const result = await moduleRef
      .get(ProjectsService)
      .generatePrompts('pappu-it-office');

    expect(result.success).toBe(true);
    expect(mockPromptAgent.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        scenes: expect.any(Array),
        dialogues: expect.any(Array),
      }),
    );
  });
});

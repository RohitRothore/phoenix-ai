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
              text: 'Zzz...',
              emotion: 'sleepy',
              timing: 'reaction',
            },
          ],
        },
      ],
      generatedAt: new Date().toISOString(),
    }),
  };

  const mockPromptAgent = {
    execute: jest.fn().mockResolvedValue({
      promptVersion: '1.0.0',
      scenes: [
        {
          id: 1,
          prompt: 'A stylized office scene with Pappu asleep at his desk.',
          negativePrompt: 'No text overlays or visual distortion.',
          camera: 'Medium dolly-in',
          lighting: 'Warm office lighting',
          mood: 'Playful',
        },
      ],
      generatedAt: new Date().toISOString(),
    }),
  };

  const mockVideoPreparationPipeline = {
    run: jest.fn().mockResolvedValue({
      scenes: [
        {
          id: 1,
          scenePath: 'video/scene-001.mp4',
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

  it('creates a project directory and returns a project payload', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
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
        ProjectsService,
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
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    const result = await service.generateDirectorPlan('pappu-it-office');

    expect(result.success).toBe(true);
    expect(writeJson).toHaveBeenCalledWith(
      'projects/pappu-it-office/director.json',
      expect.objectContaining({
        genre: 'Comedy',
      }),
    );
  });

  it('generates a story artifact from the saved director plan', async () => {
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
        ProjectsService,
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
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    const result = await service.generateStory('pappu-it-office');

    expect(result.success).toBe(true);
    expect(writeJson).toHaveBeenCalledWith(
      'projects/pappu-it-office/story.json',
      expect.objectContaining({
        title: 'Pappu IT Office',
      }),
    );
  });

  it('generates scenes from the saved story plan', async () => {
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
      if (path === 'projects/pappu-it-office/director.json') {
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

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
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
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    const result = await service.generateScenes('pappu-it-office');

    expect(result.success).toBe(true);
    expect(writeJson).toHaveBeenCalledWith(
      'projects/pappu-it-office/scenes.json',
      expect.objectContaining({
        scenes: expect.any(Array),
      }),
    );
  });

  it('generates render prompts from ready project artifacts', async () => {
    const writeJson = jest.fn().mockResolvedValue(undefined);
    const readJson = jest.fn().mockImplementation(async (path: string) => {
      if (path.endsWith('/project.json')) {
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
      if (path.endsWith('/director.json')) {
        return {
          genre: 'Comedy',
          targetAudience: '18-35',
          tone: 'Sarcastic',
          pacing: 'Fast',
          storyStructure: ['Hook'],
          visualStyle: 'Pixar',
          comedyMechanics: ['Situational'],
          contentGuidelines: 'Family-friendly',
          generatedAt: '2026-07-20T00:00:00.000Z',
          status: 'ready',
        };
      }
      if (path.endsWith('/scenes.json')) {
        return {
          scenes: [
            {
              id: 1,
              title: 'Intro',
              act: 'Setup',
              duration: 8,
              description: 'Pappu sleeps at his desk',
              dialogue: '',
              visualPrompt: 'Office scene',
              comedyElement: 'Snores',
            },
          ],
          generatedAt: '2026-07-20T00:00:00.000Z',
          status: 'ready',
        };
      }
      return {
        scenes: [
          {
            id: 1,
            dialogue: [
              {
                character: 'Pappu',
                text: 'Zzz',
                emotion: 'sleepy',
                timing: 'reaction',
              },
            ],
          },
        ],
        generatedAt: '2026-07-20T00:00:00.000Z',
        status: 'ready',
      };
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: LocalStorageService,
          useValue: {
            ensureDirectory: jest.fn(),
            writeJson,
            readJson,
            exists: jest.fn().mockResolvedValue(true),
            listDirectories: jest.fn(),
          },
        },
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
    expect(writeJson).toHaveBeenCalledWith(
      'projects/pappu-it-office/prompts.json',
      expect.objectContaining({ promptVersion: '1.0.0', status: 'ready' }),
    );
  });
});

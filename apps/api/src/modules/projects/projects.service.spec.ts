import { Test } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { LocalStorageService } from '../../common/storage/local-storage.service';
import { DirectorAgent } from '../ai/agents/director/director.agent';
import { StoryAgent } from '../ai/agents/story/story.agent';
import { SceneAgent } from '../ai/agents/scene/scene.agent';
import { DialogueAgent } from '../ai/agents/dialogue/dialogue.agent';

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
        characters: [{ name: 'Pappu', role: 'protagonist', personality: 'Lazy' }],
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
});

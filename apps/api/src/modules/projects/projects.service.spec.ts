import { Test } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { LocalStorageService } from '../../common/storage/local-storage.service';

describe('ProjectsService', () => {
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
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    const result = await service.generateDirectorPlan('pappu-it-office');

    expect(result.success).toBe(true);
    expect(writeJson).toHaveBeenCalledWith('projects/pappu-it-office/director.json', expect.objectContaining({
      genre: 'Comedy',
    }));
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
        pacing: 'Fast',
        storyStructure: ['Hook', 'Setup', 'Conflict', 'Punchline'],
        topic: 'Pappu IT Office',
        language: 'Hindi',
        platform: 'YouTube Shorts',
        style: 'Pixar',
        humor: 'Sarcastic',
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
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    const result = await service.generateStory('pappu-it-office');

    expect(result.success).toBe(true);
    expect(writeJson).toHaveBeenCalledWith('projects/pappu-it-office/story.json', expect.objectContaining({
      title: 'Pappu IT Office',
    }));
  });
});

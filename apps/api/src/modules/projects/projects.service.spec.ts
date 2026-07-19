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
});

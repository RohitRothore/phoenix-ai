import { UnprocessableEntityException } from '@nestjs/common';
import { AIProvider } from '@phoenix/ai-core';
import { ProviderRegistry } from '@phoenix/providers';

import { PromptAgent } from './prompt.agent';
import { PromptInput } from './prompt.types';

describe('PromptAgent', () => {
  const input: PromptInput = {
    project: { language: 'Hindi', platform: 'YouTube Shorts', style: 'Pixar' },
    directorPlan: {
      genre: 'Comedy', targetAudience: '18-35', tone: 'Sarcastic', pacing: 'Fast', storyStructure: ['Hook'], visualStyle: 'Pixar', comedyMechanics: ['Situational comedy'], contentGuidelines: 'Family-friendly', generatedAt: '2026-07-20T00:00:00.000Z',
    },
    scenes: [{ id: 1, title: 'Intro', act: 'Setup', duration: 8, description: 'Pappu sleeps at his desk.', dialogue: '', visualPrompt: 'Office scene', comedyElement: 'Snores loudly' }],
    dialogues: [{ id: 1, dialogue: [{ character: 'Pappu', text: 'Zzz', emotion: 'sleepy', timing: 'reaction' }] }],
  };

  it('returns validated prompts for every requested scene', async () => {
    const agent = createAgent('{"scenes":[{"id":1,"prompt":"Animated office scene","negativePrompt":"No text","camera":"Medium shot","lighting":"Warm","mood":"Playful"}]}');

    const result = await agent.execute(input);

    expect(result.promptVersion).toBe('1.0.0');
    expect(result.scenes).toEqual([expect.objectContaining({ id: 1, camera: 'Medium shot' })]);
  });

  it('rejects a response with a missing scene', async () => {
    const agent = createAgent('{"scenes":[]}');

    await expect(agent.execute(input)).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

function createAgent(responseText: string): PromptAgent {
  const provider: AIProvider = {
    provider: 'gemini',
    model: 'test-model',
    generateText: jest.fn().mockResolvedValue({
      text: responseText,
      provider: 'gemini',
      model: 'test-model',
    }),
  };
  const registry = new ProviderRegistry();
  registry.register(provider);

  return new PromptAgent(registry);
}

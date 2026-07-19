export interface ComedyPromptInput {
  topic: string;

  language: string;

  duration: number;

  style: string;

  audience: string;

  humor: string;

  characters?: string[];

  platform: string;
}
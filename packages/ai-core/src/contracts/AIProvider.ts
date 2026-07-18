export interface GenerateTextRequest {
    systemPrompt?: string;

    prompt: string;

    temperature?: number;

    maxTokens?: number;
}

export interface GenerateTextResponse {
    text: string;

    provider: string;

    model: string;
}

export interface AIProvider {

    readonly provider: string;

    readonly model: string;

    generateText(
        request: GenerateTextRequest,
    ): Promise<GenerateTextResponse>;
}
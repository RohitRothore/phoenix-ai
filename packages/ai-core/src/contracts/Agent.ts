export interface Agent<
    TInput,
    TOutput,
> {
    execute(
        input: TInput,
    ): Promise<TOutput>;
}
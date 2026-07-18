export interface Pipeline<
    TInput,
    TOutput,
> {

    run(
        input: TInput,
    ): Promise<TOutput>;

}
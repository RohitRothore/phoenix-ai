import { IsInt, IsString, Min } from 'class-validator';

export class GenerateStoryDto {
  @IsString()
  topic!: string;

  @IsString()
  language!: string;

  @IsInt()
  @Min(15)
  duration!: number;

  @IsString()
  humor!: string;

  @IsString()
  style!: string;

  @IsString()
  platform!: string;
}

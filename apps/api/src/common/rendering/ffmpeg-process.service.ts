import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class FfmpegProcessService {
  private readonly logger = new Logger(FfmpegProcessService.name);

  async run(args: string[], operation: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const process = spawn('ffmpeg', args, {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      let errorOutput = '';
      process.stderr.on('data', (chunk: Buffer) => {
        errorOutput += chunk.toString();
      });
      process.on('error', (error: Error) => reject(error));
      process.on('close', (code: number | null) =>
        code === 0 ? resolve() : reject(new Error(errorOutput)),
      );
    }).catch((error: unknown) => {
      this.logger.error(
        `FFmpeg failed while attempting ${operation}.`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(`FFmpeg could not ${operation}.`);
    });
  }
}

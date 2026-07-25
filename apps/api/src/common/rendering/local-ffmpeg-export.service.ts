import { Injectable } from '@nestjs/common';

import { LocalStorageService } from '../storage/local-storage.service';
import { FfmpegProcessService } from './ffmpeg-process.service';

@Injectable()
export class LocalFfmpegExportService {
  constructor(
    private readonly storage: LocalStorageService,
    private readonly ffmpeg: FfmpegProcessService,
  ) {}

  async export(
    projectSlug: string,
    videoPath: string,
    subtitlePath: string,
  ): Promise<string> {
    const projectPath = `projects/${projectSlug}`;
    const outputPath = `${projectPath}/exports/phoenix-short.mp4`;
    await this.storage.ensureDirectory(`${projectPath}/exports`);

    await this.ffmpeg.run(
      [
        '-y',
        '-i',
        this.storage.getAbsolutePath(`${projectPath}/${videoPath}`),
        '-vf',
        `drawbox=x=0:y=ih*0.75:w=iw:h=ih*0.25:color=black@0.6:t=fill,subtitles=${this.storage.getAbsolutePath(`${projectPath}/${subtitlePath}`)}:force_style='FontName=DejaVu Sans,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=4,BackColour=&H80000000,Outline=0,Alignment=2,MarginV=60,MarginL=60,MarginR=60'`,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        this.storage.getAbsolutePath(outputPath),
      ],
      'export the captioned video',
    );

    return 'exports/phoenix-short.mp4';
  }
}

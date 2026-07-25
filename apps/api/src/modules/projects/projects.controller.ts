import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  list() {
    return this.projectsService.list();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.projectsService.findOne(slug);
  }

  @Get(':slug/director-plan')
  getDirectorPlan(@Param('slug') slug: string) {
    return this.projectsService.getDirectorPlan(slug);
  }

  @Get(':slug/story')
  getStory(@Param('slug') slug: string) {
    return this.projectsService.getStory(slug);
  }

  @Get(':slug/scenes')
  getScenes(@Param('slug') slug: string) {
    return this.projectsService.getScenes(slug);
  }

  @Post(':slug/director-plan')
  generateDirectorPlan(@Param('slug') slug: string) {
    return this.projectsService.generateDirectorPlan(slug);
  }

  @Post(':slug/story')
  generateStory(@Param('slug') slug: string) {
    return this.projectsService.generateStory(slug);
  }

  @Post(':slug/scenes')
  generateScenes(@Param('slug') slug: string) {
    return this.projectsService.generateScenes(slug);
  }

  @Get(':slug/dialogues')
  getDialogues(@Param('slug') slug: string) {
    return this.projectsService.getDialogues(slug);
  }

  @Post(':slug/dialogues')
  generateDialogues(@Param('slug') slug: string) {
    return this.projectsService.generateDialogues(slug);
  }

  @Get(':slug/prompts')
  getPrompts(@Param('slug') slug: string) {
    return this.projectsService.getPrompts(slug);
  }

  @Post(':slug/prompts')
  generatePrompts(@Param('slug') slug: string) {
    return this.projectsService.generatePrompts(slug);
  }

  @Get(':slug/video')
  getVideoPlan(@Param('slug') slug: string) {
    return this.projectsService.getVideoPlan(slug);
  }

  @Post(':slug/video')
  prepareVideo(@Param('slug') slug: string) {
    return this.projectsService.prepareVideo(slug);
  }

  @Post(':slug/video/render')
  renderVideo(@Param('slug') slug: string) {
    return this.projectsService.renderVideo(slug);
  }

  @Get(':slug/subtitles')
  getSubtitles(@Param('slug') slug: string) {
    return this.projectsService.getSubtitles(slug);
  }

  @Post(':slug/subtitles')
  generateSubtitles(@Param('slug') slug: string) {
    return this.projectsService.generateSubtitles(slug);
  }

  @Get(':slug/voice')
  getVoice(@Param('slug') slug: string) {
    return this.projectsService.getVoice(slug);
  }

  @Post(':slug/voice')
  generateVoice(@Param('slug') slug: string) {
    return this.projectsService.generateVoice(slug);
  }

  @Post(':slug/export')
  exportVideo(@Param('slug') slug: string) {
    return this.projectsService.exportVideo(slug);
  }

  @Get(':slug/export/download')
  async downloadExport(@Param('slug') slug: string, @Res() res: Response) {
    const { buffer, filename, contentType } =
      await this.projectsService.downloadExport(slug);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer);
  }

  // ─── Image Generation Endpoints ──────────────────────────────────────────

  @Post(':slug/images')
  generateImages(@Param('slug') slug: string) {
    return this.projectsService.generateImages(slug);
  }

  @Post(':slug/images/:sceneId/regenerate')
  regenerateImage(
    @Param('slug') slug: string,
    @Param('sceneId') sceneId: string,
  ) {
    return this.projectsService.regenerateImage(slug, sceneId);
  }

  @Get(':slug/images')
  getImages(@Param('slug') slug: string) {
    return this.projectsService.getImages(slug);
  }

  @Get(':slug/assets')
  getAssets(@Param('slug') slug: string, @Query('type') type?: string) {
    return this.projectsService.getAssets(slug, type);
  }

  // ─── Scene Rendering Endpoints ───────────────────────────────────────────

  @Post(':slug/render')
  renderProject(@Param('slug') slug: string) {
    return this.projectsService.renderProject(slug);
  }

  @Post(':slug/render/:sceneId')
  renderScene(@Param('slug') slug: string, @Param('sceneId') sceneId: string) {
    return this.projectsService.renderScene(slug, sceneId);
  }

  // ─── Pipeline Status Endpoints ───────────────────────────────────────────

  @Get(':slug/pipeline')
  getPipelineStatus(@Param('slug') slug: string) {
    return this.projectsService.getPipelineStatus(slug);
  }

  @Post(':slug/pipeline/:stage/retry')
  retryStage(@Param('slug') slug: string, @Param('stage') stage: string) {
    return this.projectsService.retryStage(slug, stage);
  }

  @Post(':slug/pipeline/:stage/resume')
  resumePipeline(@Param('slug') slug: string, @Param('stage') stage: string) {
    return this.projectsService.resumePipeline(slug, stage);
  }
}

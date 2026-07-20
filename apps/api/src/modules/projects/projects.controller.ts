import { Body, Controller, Get, Param, Post } from '@nestjs/common';

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
}

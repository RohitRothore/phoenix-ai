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

  @Post(':slug/director-plan')
  generateDirectorPlan(@Param('slug') slug: string) {
    return this.projectsService.generateDirectorPlan(slug);
  }

  @Post(':slug/story')
  generateStory(@Param('slug') slug: string) {
    return this.projectsService.generateStory(slug);
  }

  @Get()
  list() {
    return this.projectsService.list();
  }
}

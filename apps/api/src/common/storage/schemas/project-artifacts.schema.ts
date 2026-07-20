import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectArtifactDocument = ProjectArtifact & Document;

export type ArtifactStatus = 'pending' | 'ready';

@Schema({ collection: 'project_artifacts' })
export class ProjectArtifact {
  @Prop({ required: true })
  projectId: string;

  @Prop({
    required: true,
    enum: [
      'director',
      'story',
      'scenes',
      'dialogues',
      'prompts',
      'video',
      'subtitles',
    ],
  })
  type: string;

  @Prop({ type: Object })
  data: Record<string, unknown>;

  @Prop({ default: 'pending' })
  status: ArtifactStatus;

  @Prop()
  srtPath?: string;

  @Prop()
  renderStatus?: string;

  @Prop()
  finalPath?: string;

  @Prop()
  renderedAt?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ProjectArtifactSchema =
  SchemaFactory.createForClass(ProjectArtifact);

ProjectArtifactSchema.index({ projectId: 1, type: 1 }, { unique: true });

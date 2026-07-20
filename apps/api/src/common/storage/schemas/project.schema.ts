import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ collection: 'projects' })
export class Project {
  @Prop({ required: true, unique: true })
  id?: string;

  @Prop({ required: true })
  name?: string;

  @Prop({ required: true, unique: true })
  slug?: string;

  @Prop()
  language?: string;

  @Prop()
  platform?: string;

  @Prop()
  style?: string;

  @Prop({ default: 'light' })
  humor?: string;

  @Prop({ default: 'draft' })
  status?: string;

  @Prop({ required: true })
  createdAt?: string;

  @Prop({ required: true })
  updatedAt?: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GenerationJobDocument = GenerationJob & Document;

export type JobStatus =
  'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

@Schema({ collection: 'generation_jobs' })
export class GenerationJob {
  @Prop({ required: true })
  projectId?: string;

  @Prop({ required: true })
  sceneId?: string;

  @Prop({ required: true })
  type?: string;

  @Prop({ required: true })
  provider?: string;

  @Prop({ default: 'pending' })
  status?: JobStatus;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  retryCount?: number;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  request?: Record<string, unknown>;

  @Prop({ type: Object })
  response?: Record<string, unknown>;

  @Prop({ type: [{ timestamp: Date, level: String, message: String }] })
  logs?: Array<{ timestamp: Date; level: string; message: string }>;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const GenerationJobSchema = SchemaFactory.createForClass(GenerationJob);

GenerationJobSchema.index({ projectId: 1, sceneId: 1, type: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PipelineStateDocument = PipelineState & Document;

export type PipelineStage =
  | 'director'
  | 'story'
  | 'scenes'
  | 'dialogues'
  | 'prompts'
  | 'image-generation'
  | 'scene-rendering'
  | 'subtitle-generation'
  | 'voice-generation'
  | 'export';

export type PipelineStatus =
  'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

@Schema({ collection: 'pipeline_states' })
export class PipelineState {
  @Prop({ required: true })
  projectId?: string;

  @Prop({ required: true })
  stage?: PipelineStage;

  @Prop({ default: 'pending' })
  status?: PipelineStatus;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  retryCount?: number;

  @Prop()
  errorMessage?: string;

  @Prop({ type: [{ timestamp: Date, level: String, message: String }] })
  logs?: Array<{ timestamp: Date; level: string; message: string }>;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const PipelineStateSchema = SchemaFactory.createForClass(PipelineState);

PipelineStateSchema.index({ projectId: 1, stage: 1 }, { unique: true });

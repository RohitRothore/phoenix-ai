import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExportDocument = Export & Document;

export type ExportStatus = 'pending' | 'rendering' | 'completed' | 'failed';

@Schema({ collection: 'exports' })
export class Export {
  @Prop({ required: true })
  projectId?: string;

  @Prop({ required: true })
  filename?: string;

  @Prop({ required: true })
  path?: string;

  @Prop()
  url?: string;

  @Prop({ default: 'pending' })
  status?: ExportStatus;

  @Prop()
  duration?: number;

  @Prop()
  fileSize?: number;

  @Prop()
  resolution?: string;

  @Prop()
  frameRate?: number;

  @Prop()
  profile?: string;

  @Prop()
  exportedAt?: Date;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const ExportSchema = SchemaFactory.createForClass(Export);

ExportSchema.index({ projectId: 1 });

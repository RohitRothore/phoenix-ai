import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssetDocument = Asset & Document;

export type AssetType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SUBTITLE' | 'EXPORT';

export type AssetStatus =
  'pending' | 'generating' | 'ready' | 'failed' | 'cancelled';

@Schema({ collection: 'assets' })
export class Asset {
  @Prop({ required: true })
  projectId?: string;

  @Prop({ required: true })
  sceneId?: string;

  @Prop({
    required: true,
    enum: ['IMAGE', 'VIDEO', 'AUDIO', 'SUBTITLE', 'EXPORT'],
  })
  type?: AssetType;

  @Prop({ required: true })
  filename?: string;

  @Prop({ required: true })
  path?: string;

  @Prop()
  url?: string;

  @Prop()
  mimeType?: string;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  duration?: number;

  @Prop()
  fileSize?: number;

  @Prop()
  seed?: number;

  @Prop()
  provider?: string;

  @Prop()
  model?: string;

  @Prop()
  generationTime?: number;

  @Prop({ default: 'pending' })
  status?: AssetStatus;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, ref: 'GridFS' })
  gridfsId?: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);

AssetSchema.index({ projectId: 1, sceneId: 1, type: 1 });

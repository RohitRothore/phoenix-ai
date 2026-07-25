import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Readable } from 'stream';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

@Injectable()
export class GridFsService implements OnModuleInit {
  private readonly logger = new Logger(GridFsService.name);

  private bucket: any;

  constructor(@InjectConnection() private readonly connection: Connection) {}

  private get mongo() {
    return (this.connection as any).base.mongo;
  }

  onModuleInit(): void {
    this.connection.once('open', () => {
      this.bucket = new this.mongo.GridFSBucket(this.connection.db!, {
        bucketName: 'assets',
      });
    });
    if (Number(this.connection.readyState) === 1) {
      this.bucket = new this.mongo.GridFSBucket(this.connection.db!, {
        bucketName: 'assets',
      });
    }
  }

  private ensureBucket(): void {
    if (!this.bucket) {
      this.bucket = new this.mongo.GridFSBucket(this.connection.db!, {
        bucketName: 'assets',
      });
    }
  }

  private toObjectId(fileId: string) {
    return new this.mongo.ObjectId(fileId);
  }

  async uploadFile(
    filename: string,
    data: Buffer,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    this.ensureBucket();
    const existing = await this.findByName(filename);
    if (existing) {
      await this.deleteByName(filename);
    }
    return new Promise<string>((resolve, reject) => {
      const uploadStream = this.bucket.openUploadStream(filename, { metadata });
      const readable = Readable.from(data);
      readable.pipe(uploadStream);
      uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
      uploadStream.on('error', reject);
    });
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    this.ensureBucket();
    const downloadStream = this.bucket.openDownloadStream(
      this.toObjectId(fileId),
    );
    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
      downloadStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
      downloadStream.on('error', reject);
    });
  }

  async downloadByName(filename: string): Promise<Buffer | null> {
    this.ensureBucket();
    const file = await this.findByName(filename);
    if (!file) return null;
    return this.downloadFile(String(file._id));
  }

  async findByName(
    filename: string,
  ): Promise<{ _id: unknown; filename: string } | null> {
    this.ensureBucket();
    const files = await this.bucket.find({ filename }).toArray();
    return files.length > 0
      ? { _id: files[0]._id, filename: files[0].filename }
      : null;
  }

  async deleteFile(fileId: string): Promise<void> {
    this.ensureBucket();
    await this.bucket.delete(this.toObjectId(fileId));
  }

  async deleteByName(filename: string): Promise<void> {
    this.ensureBucket();
    const file = await this.findByName(filename);
    if (file) {
      await this.deleteFile(String(file._id));
    }
  }

  async fileExists(filename: string): Promise<boolean> {
    const file = await this.findByName(filename);
    return file !== null;
  }
}

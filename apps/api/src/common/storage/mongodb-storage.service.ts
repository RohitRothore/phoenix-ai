import { Injectable, OnModuleInit } from '@nestjs/common';
import { StorageService } from './storage.service';

@Injectable()
export class MongoDBStorageService implements StorageService, OnModuleInit {
  async onModuleInit(): Promise<void> {
    // MongoDB connection is handled by MongooseModule
    // This is called after the module is initialized
  }

  async createDirectory(_path: string): Promise<void> {
    // MongoDB doesn't need directory creation
    // Collections are created automatically
  }

  async ensureDirectory(_path: string): Promise<void> {
    // MongoDB doesn't need directory creation
  }

  async writeJson(_path: string, _data: any): Promise<void> {
    // In MongoDB, we don't write JSON to paths directly
    // This method will be used differently in the repository pattern
    // For now, this is a placeholder
  }

  async writeText(_path: string, _content: string): Promise<void> {
    // Similar to writeJson, this will be handled differently
  }

  async readJson<T>(_path: string): Promise<T> {
    // This will be handled by the repository pattern
    throw new Error('Not implemented - use repository pattern instead');
  }

  async writeBinary(_path: string, _data: Buffer): Promise<void> {
    // MongoDB doesn't write binary data directly to paths
    // This will be handled by the repository pattern
  }

  async readBinary(_path: string): Promise<Buffer> {
    throw new Error('Not implemented - use repository pattern instead');
  }

  async exists(_path: string): Promise<boolean> {
    // This will be handled by the repository pattern
    throw new Error('Not implemented - use repository pattern instead');
  }

  async listDirectories(_path: string): Promise<string[]> {
    // This will be handled by the repository pattern
    throw new Error('Not implemented - use repository pattern instead');
  }

  getAbsolutePath(path: string): string {
    // Not applicable for MongoDB
    return path;
  }
}

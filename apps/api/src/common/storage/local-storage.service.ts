import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import path from 'path';

import { StorageService } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly rootDir = path.resolve(process.cwd(), '..', '..', 'storage');

  private resolvePath(inputPath: string) {
    return path.resolve(this.rootDir, inputPath);
  }

  async createDirectory(inputPath: string): Promise<void> {
    await mkdir(this.resolvePath(inputPath), { recursive: true });
  }

  async ensureDirectory(inputPath: string): Promise<void> {
    await mkdir(this.resolvePath(inputPath), { recursive: true });
  }

  async writeJson(inputPath: string, data: unknown): Promise<void> {
    const filePath = this.resolvePath(inputPath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async writeText(inputPath: string, content: string): Promise<void> {
    const filePath = this.resolvePath(inputPath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf8');
  }

  async readJson<T>(inputPath: string): Promise<T> {
    const filePath = this.resolvePath(inputPath);
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  }

  async readBinary(inputPath: string): Promise<Buffer> {
    const filePath = this.resolvePath(inputPath);
    return readFile(filePath);
  }

  async writeBinary(inputPath: string, data: Buffer): Promise<void> {
    const filePath = this.resolvePath(inputPath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
  }

  async exists(inputPath: string): Promise<boolean> {
    return existsSync(this.resolvePath(inputPath));
  }

  async listDirectories(inputPath: string): Promise<string[]> {
    const targetPath = this.resolvePath(inputPath);
    const entries = await readdir(targetPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  }

  getAbsolutePath(inputPath: string): string {
    return this.resolvePath(inputPath);
  }
}

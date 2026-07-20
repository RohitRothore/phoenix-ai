export abstract class StorageService {
  abstract createDirectory(path: string): Promise<void>;
  abstract ensureDirectory(path: string): Promise<void>;
  abstract writeJson(path: string, data: unknown): Promise<void>;
  abstract writeText(path: string, content: string): Promise<void>;
  abstract readJson<T>(path: string): Promise<T>;
  abstract readBinary(path: string): Promise<Buffer>;
  abstract exists(path: string): Promise<boolean>;
  abstract listDirectories(path: string): Promise<string[]>;
  abstract getAbsolutePath(path: string): string;
}

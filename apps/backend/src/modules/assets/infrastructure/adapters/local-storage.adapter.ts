import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import type { StorageAdapterPort, StorageUploadInput } from './storage.adapter.port';

@Injectable()
export class LocalStorageAdapter implements StorageAdapterPort {
  private readonly rootDir: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    this.rootDir = join(process.cwd(), 'uploads');
    this.publicBase = this.config.get<string>(
      'STORAGE_LOCAL_PUBLIC_BASE',
      'http://localhost:3000/uploads',
    );
  }

  async upload(input: StorageUploadInput): Promise<void> {
    const fullPath = join(this.rootDir, input.key);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.body);
  }

  async getSignedDownloadUrl(key: string, _expiresInSeconds: number): Promise<string> {
    return `${this.publicBase}/${key}`;
  }

  async deleteObject(key: string): Promise<void> {
    const fullPath = join(this.rootDir, key);
    await rm(fullPath, { force: true });
  }

  getPublicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }

  async readObject(key: string): Promise<Buffer> {
    return readFile(join(this.rootDir, key));
  }
}

export interface StorageUploadInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StorageAdapterPort {
  upload(input: StorageUploadInput): Promise<void>;
  readObject(key: string): Promise<Buffer>;
  getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

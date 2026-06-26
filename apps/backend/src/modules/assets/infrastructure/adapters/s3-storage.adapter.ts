import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { StorageAdapterPort, StorageUploadInput } from './storage.adapter.port';

@Injectable()
export class S3StorageAdapter implements StorageAdapterPort {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('S3_ENDPOINT');
    const region = config.get<string>('S3_REGION', 'us-east-1');

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint,
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY', ''),
        secretAccessKey: config.get<string>('S3_SECRET_KEY', ''),
      },
    });

    this.bucket = config.get<string>('S3_BUCKET', 'agenteia-assets');
  }

  async upload(input: StorageUploadInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getPublicUrl(key: string): string {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    if (endpoint) {
      return `${endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    }
    const region = this.config.get<string>('S3_REGION', 'us-east-1');
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}

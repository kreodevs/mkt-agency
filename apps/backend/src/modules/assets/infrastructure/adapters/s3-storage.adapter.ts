import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageAdapterPort, StorageUploadInput } from './storage.adapter.port';

@Injectable()
export class S3StorageAdapter implements StorageAdapterPort, OnModuleInit {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly client: S3Client;
  private readonly signingClient: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('S3_ENDPOINT');
    const region = config.get<string>('S3_REGION', 'us-east-1');
    const credentials = {
      accessKeyId: config.get<string>('S3_ACCESS_KEY', ''),
      secretAccessKey: config.get<string>('S3_SECRET_KEY', ''),
    };

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint,
      credentials,
    });

    const publicEndpoint = config.get<string>('S3_PUBLIC_ENDPOINT');
    this.signingClient = publicEndpoint
      ? new S3Client({
          region,
          endpoint: publicEndpoint,
          forcePathStyle: true,
          credentials,
        })
      : this.client;

    this.bucket = config.get<string>('S3_BUCKET', 'mkt-agency-assets');
  }

  async onModuleInit(): Promise<void> {
    const hasCredentials =
      !!this.config.get<string>('S3_ACCESS_KEY') &&
      !!this.config.get<string>('S3_SECRET_KEY') &&
      !!this.bucket;

    if (!hasCredentials) {
      return;
    }

    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode;
      const name = error instanceof Error ? error.name : '';
      const missing =
        status === 404 || name === 'NotFound' || name === 'NoSuchBucket';

      if (!missing) {
        this.logger.warn(
          `S3 bucket check failed for "${this.bucket}": ${error instanceof Error ? error.message : error}`,
        );
        return;
      }
    }

    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Created S3 bucket "${this.bucket}"`);
    } catch (error) {
      this.logger.error(
        `Failed to create S3 bucket "${this.bucket}": ${error instanceof Error ? error.message : error}`,
      );
    }
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

  async readObject(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const body = response.Body;
    if (!body) {
      throw new Error('S3 object body is empty');
    }
    return Buffer.from(await body.transformToByteArray());
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.signingClient, command, { expiresIn: expiresInSeconds });
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

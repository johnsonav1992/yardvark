import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as convert from 'heic-convert';
import * as path from 'path';
import { tryCatch } from 'src/utils/tryCatch';
import { LogHelpers } from '../../logger/logger.helpers';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION_YARDVARK,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_YARDVARK!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_YARDVARK!,
      },
    });

    this.bucketName = process.env.AWS_S3_BUCKET_YARDVARK!;
  }

  public async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    LogHelpers.addBusinessContext('fileSize', file.size);
    LogHelpers.addBusinessContext('fileMimeType', file.mimetype);

    const { buffer, originalname, mimetype } =
      await this.checkForHeicAndConvert(file);

    const key = this.createFileKey(userId, originalname);

    const uploadParams: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer || file.buffer,
      ContentType: mimetype || file.mimetype,
      ACL: 'public-read',
    };

    const start = Date.now();
    let success = true;

    try {
      await this.s3.send(new PutObjectCommand(uploadParams));
    } catch (error) {
      success = false;
      throw error;
    } finally {
      LogHelpers.recordExternalCall('aws-s3', Date.now() - start, success);
    }

    LogHelpers.addBusinessContext('s3UploadSuccess', true);

    return `https://${this.bucketName}.s3.${process.env.AWS_REGION_YARDVARK}.amazonaws.com/${encodeURIComponent(key)}`;
  }

  public async uploadFiles(
    files: Express.Multer.File[],
    userId: string,
    concurrency = 5,
  ): Promise<string[]> {
    LogHelpers.addBusinessContext('batchUploadCount', files.length);

    const results: string[] = [];

    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map((file) => this.uploadFile(file, userId)),
      );

      results.push(...batchResults);
    }

    LogHelpers.addBusinessContext('batchUploadSuccess', results.length);

    return results;
  }

  private createFileKey(userId: string, fileName: string): string {
    return `${userId}/${randomUUID().substring(0, 4)}-${fileName}`;
  }

  private async checkForHeicAndConvert(file: Express.Multer.File): Promise<{
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }> {
    let bufferToUpload = file.buffer;
    let filename = file.originalname;
    let mimetype = file.mimetype;

    const isHeic =
      file.mimetype === 'image/heic' ||
      file.mimetype === 'image/heif' ||
      path.extname(file.originalname).toLowerCase() === '.heic';

    if (isHeic) {
      const { data: jpegBuffer, error } = await tryCatch(
        () =>
          convert({
            buffer: file.buffer,
            format: 'JPEG',
            quality: 0.9,
          }) as Promise<Buffer>,
      );

      if (error) {
        throw new Error(`Failed to convert HEIC file: ${error.message}`);
      }

      bufferToUpload = jpegBuffer;
      filename = filename.replace(/\.heic$/i, '.jpg');
      mimetype = 'image/jpeg';
    }

    return {
      buffer: bufferToUpload,
      originalname: filename,
      mimetype: mimetype,
    };
  }
}

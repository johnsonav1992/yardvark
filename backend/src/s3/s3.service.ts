import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

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
    const key = this.createFileKey(userId, file.originalname);

    const uploadParams: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    await this.s3.send(new PutObjectCommand(uploadParams));

    return `https://${this.bucketName}.s3.${process.env.AWS_REGION_YARDVARK}.amazonaws.com/${key}`;
  }

  private createFileKey(userId: string, fileName: string): string {
    return `${userId}/${fileName}-${randomUUID().substring(0, 4)}`;
  }
}

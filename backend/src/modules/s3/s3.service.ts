import { randomUUID } from "node:crypto";
import * as path from "node:path";
import {
	PutObjectCommand,
	type PutObjectCommandInput,
	S3Client,
} from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as convert from "heic-convert";
import { LogHelpers } from "../../logger/logger.helpers";
import { BusinessContextKeys } from "../../logger/logger-keys.constants";
import { type Either, error, success } from "../../types/either";
import { HeicConversionError, S3UploadError } from "./s3.errors";

@Injectable()
export class S3Service {
	private readonly s3: S3Client;
	private readonly bucketName: string;

	constructor(readonly _configService: ConfigService) {
		this.s3 = new S3Client({
			region: process.env.AWS_REGION_YARDVARK,
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID_YARDVARK ?? "",
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_YARDVARK ?? "",
			},
		});

		this.bucketName = process.env.AWS_S3_BUCKET_YARDVARK ?? "";
	}

	public async uploadFile(
		file: Express.Multer.File,
		userId: string,
	): Promise<Either<S3UploadError | HeicConversionError, string>> {
		LogHelpers.addBusinessContext(BusinessContextKeys.fileSize, file.size);
		LogHelpers.addBusinessContext(
			BusinessContextKeys.fileMimeType,
			file.mimetype,
		);

		const conversionResult = await this.checkForHeicAndConvert(file);

		if (conversionResult.isError()) {
			return error(conversionResult.value);
		}

		const { buffer, originalname, mimetype } = conversionResult.value;

		const key = this.createFileKey(userId, originalname);

		const uploadParams: PutObjectCommandInput = {
			Bucket: this.bucketName,
			Key: key,
			Body: buffer || file.buffer,
			ContentType: mimetype || file.mimetype,
			ACL: "public-read",
		};

		const start = Date.now();

		try {
			await this.s3.send(new PutObjectCommand(uploadParams));
		} catch (err) {
			LogHelpers.recordExternalCall("aws-s3", Date.now() - start, false);

			return error(new S3UploadError(err));
		}

		LogHelpers.recordExternalCall("aws-s3", Date.now() - start, true);
		LogHelpers.addBusinessContext(BusinessContextKeys.s3UploadSuccess, true);

		const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION_YARDVARK}.amazonaws.com/${encodeURIComponent(key)}`;

		return success(url);
	}

	public async uploadFiles(
		files: Express.Multer.File[],
		userId: string,
		concurrency = 5,
	): Promise<Either<S3UploadError | HeicConversionError, string[]>> {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.batchUploadCount,
			files.length,
		);

		const results: string[] = [];

		for (let i = 0; i < files.length; i += concurrency) {
			const batch = files.slice(i, i + concurrency);

			const batchResults = await Promise.all(
				batch.map((file) => this.uploadFile(file, userId)),
			);

			for (const result of batchResults) {
				if (result.isError()) return error(result.value);

				results.push(result.value);
			}
		}

		LogHelpers.addBusinessContext(
			BusinessContextKeys.batchUploadSuccess,
			results.length,
		);

		return success(results);
	}

	private createFileKey(userId: string, fileName: string): string {
		return `${userId}/${randomUUID().substring(0, 4)}-${fileName}`;
	}

	private async checkForHeicAndConvert(
		file: Express.Multer.File,
	): Promise<
		Either<
			HeicConversionError,
			{ buffer: Buffer; originalname: string; mimetype: string }
		>
	> {
		let bufferToUpload = file.buffer;
		let filename = file.originalname;
		let mimetype = file.mimetype;

		const isHeic =
			file.mimetype === "image/heic" ||
			file.mimetype === "image/heif" ||
			path.extname(file.originalname).toLowerCase() === ".heic";

		if (isHeic) {
			try {
				const jpegArrayBuffer = await convert({
					buffer: file.buffer.buffer.slice(
						file.buffer.byteOffset,
						file.buffer.byteOffset + file.buffer.byteLength,
					),
					format: "JPEG",
					quality: 0.9,
				});

				bufferToUpload = Buffer.from(jpegArrayBuffer);
				filename = filename.replace(/\.heic$/i, ".jpg");
				mimetype = "image/jpeg";
			} catch (err) {
				return error(new HeicConversionError(err));
			}
		}

		return success({
			buffer: bufferToUpload,
			originalname: filename,
			mimetype: mimetype,
		});
	}
}

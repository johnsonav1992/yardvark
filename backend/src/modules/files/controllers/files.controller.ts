import type { HttpService } from '@nestjs/axios';
import {
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Post,
	Query,
	Req,
	Res,
	UploadedFiles,
	UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { firstValueFrom, map } from 'rxjs';
import type { S3Service } from 'src/modules/s3/s3.service';
import { MAX_FILE_LARGE_UPLOAD_SIZE } from 'src/utils/constants';
import { imageFileValidator } from 'src/utils/fileUtils';
import { tryCatch } from 'src/utils/tryCatch';
import type { Readable } from 'stream';

@Controller('files')
export class FilesController {
	constructor(
		private _s3Service: S3Service,
		private readonly http: HttpService
	) {}

	@Post('upload')
	@UseInterceptors(FilesInterceptor('file', 10))
	uploadFiles(
		@UploadedFiles(imageFileValidator(MAX_FILE_LARGE_UPLOAD_SIZE))
		files: Express.Multer.File[],
		@Req() req: Request
	) {
		return this._s3Service.uploadFiles(files, req.user.userId);
	}

	@Get('download')
	async downloadFile(@Query('url') fileUrl: string, @Res() res: Response) {
		const { data: fileRes, error } = await tryCatch(() =>
			firstValueFrom(
				this.http
					.get<Readable>(fileUrl, {
						responseType: 'stream',
						headers: { Accept: '*/*' }
					})
					.pipe(
						map((response) => {
							const contentType =
								(response.headers['content-type'] as string) ||
								'application/octet-stream';
							return { data: response.data, contentType };
						})
					)
			)
		);

		if (error || !fileRes) {
			throw new HttpException(
				`Failed to download file - ${error?.message || 'Unknown error'}`,
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}

		res.set({ 'Content-Type': fileRes.contentType });

		return fileRes.data.pipe(res);
	}
}

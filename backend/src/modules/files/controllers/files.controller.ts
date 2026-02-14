import { HttpService } from '@nestjs/axios';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { firstValueFrom, map } from 'rxjs';
import { S3Service } from 'src/modules/s3/s3.service';
import { MAX_FILE_LARGE_UPLOAD_SIZE } from 'src/utils/constants';
import { imageFileValidator } from 'src/utils/fileUtils';
import { resultOrThrow } from '../../../utils/resultOrThrow';
import { Readable } from 'stream';
import { User } from '../../../decorators/user.decorator';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('files')
export class FilesController {
  constructor(
    private readonly _s3Service: S3Service,
    private readonly http: HttpService,
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('file', 10))
  public async uploadFiles(
    @UploadedFiles(imageFileValidator(MAX_FILE_LARGE_UPLOAD_SIZE))
    files: Express.Multer.File[],
    @User('userId') userId: string,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'upload_files');
    LogHelpers.addBusinessContext('user_id', userId);

    return resultOrThrow(await this._s3Service.uploadFiles(files, userId));
  }

  @Get('download')
  public async downloadFile(
    @Query('url') fileUrl: string,
    @Res() res: Response,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'download_file');
    LogHelpers.addBusinessContext('file_url', fileUrl);

    let fileRes: { data: Readable; contentType: string };

    try {
      fileRes = await firstValueFrom(
        this.http
          .get<Readable>(fileUrl, {
            responseType: 'stream',
            headers: { Accept: '*/*' },
          })
          .pipe(
            map((response) => {
              const contentType =
                (response.headers['content-type'] as string) ||
                'application/octet-stream';
              return { data: response.data, contentType };
            }),
          ),
      );
    } catch (err) {
      LogHelpers.addBusinessContext('download_error', (err as Error).message);

      throw new HttpException(
        `Failed to download file - ${(err as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    res.set({ 'Content-Type': fileRes.contentType });

    return fileRes.data.pipe(res);
  }
}

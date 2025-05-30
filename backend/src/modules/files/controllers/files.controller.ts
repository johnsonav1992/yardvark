import {
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { S3Service } from 'src/modules/s3/s3.service';

@Controller('files')
export class FilesController {
  constructor(private _s3Service: S3Service) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('file', 10))
  uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    return this._s3Service.uploadFiles(files, req.user.userId);
  }
}

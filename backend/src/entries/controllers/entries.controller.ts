import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { EntriesService } from '../services/entries.service';
import {
  EntriesSearchRequest,
  EntryCreationRequest,
} from '../models/entries.types';
import { Request } from 'express';
import { tryCatch } from 'src/utils/tryCatch';
import { S3Service } from 'src/s3/s3.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('entries')
export class EntriesController {
  constructor(
    private _entriesService: EntriesService,
    private _s3Service: S3Service,
  ) {}

  @Get()
  getEntries(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this._entriesService.getEntries(req.user.userId, startDate, endDate);
  }

  @Get('single/most-recent')
  getMostRecentEntry(@Req() req: Request) {
    return this._entriesService.getMostRecentEntry(req.user.userId);
  }

  @Get('last-mow')
  async getLastMowDate(@Req() req: Request) {
    const lastMowDate = await this._entriesService.getLastMowDate(
      req.user.userId,
    );

    return { lastMowDate };
  }

  @Get('last-product-app')
  async getLastProductAppDate(@Req() req: Request) {
    const lastProductAppDate =
      await this._entriesService.getLastProductApplicationDate(req.user.userId);

    return { lastProductAppDate };
  }

  @Get('single/by-date/:date')
  getEntryByDate(@Req() req: Request, @Param('date') date: string) {
    return this._entriesService.getEntryByDate(req.user.userId, date);
  }

  @Get('single/:entryId')
  getEntry(@Param('entryId') entryId: number) {
    return this._entriesService.getEntry(entryId);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('image', 10))
  async createEntry(
    @Req() req: Request,
    @Body() entry: EntryCreationRequest,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    let imageUrls: string[] = [];

    if (files?.length) {
      const uploadPromises = files?.map((file) =>
        this._s3Service.uploadFile(file, req.user.userId),
      );

      const { data: uploadResults, error } = await tryCatch(() =>
        Promise.all(uploadPromises),
      );

      if (error) {
        throw new HttpException(
          `Error uploading files to S3 - ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      imageUrls = uploadResults || [];

      return this._entriesService.createEntry(req.user.userId, {
        ...entry,
        imageUrls,
      });
    } else {
      return this._entriesService.createEntry(req.user.userId, {
        ...entry,
        imageUrls: [],
      });
    }
  }

  @Put(':entryId')
  updateEntry(
    @Param('entryId') entryId: number,
    @Body() entry: Partial<EntryCreationRequest>,
  ) {
    return this._entriesService.updateEntry(entryId, entry);
  }

  @Delete(':entryId')
  softDeleteEntry(@Param('entryId') entryId: number) {
    return this._entriesService.softDeleteEntry(entryId);
  }

  @Post('recover/:entryId')
  recoverEntry(@Param('entryId') entryId: number) {
    return this._entriesService.recoverEntry(entryId);
  }

  @Post('search')
  searchEntries(
    @Req() req: Request,
    @Body() searchCriteria: EntriesSearchRequest,
  ) {
    return this._entriesService.searchEntries(req.user.userId, searchCriteria);
  }
}

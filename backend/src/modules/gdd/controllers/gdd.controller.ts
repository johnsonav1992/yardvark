import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { GddService } from '../services/gdd.service';
import { unwrapResult } from '../../../utils/unwrapResult';

@Controller('gdd')
export class GddController {
  constructor(private readonly _gddService: GddService) {}

  @Get('current')
  public async getCurrentGdd(@Req() req: Request) {
    return unwrapResult(await this._gddService.getCurrentGdd(req.user.userId));
  }

  @Get('historical')
  public async getHistoricalGdd(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return unwrapResult(
      await this._gddService.getHistoricalGdd(
        req.user.userId,
        startDate,
        endDate,
      ),
    );
  }

  @Get('forecast')
  public async getGddForecast(@Req() req: Request) {
    return unwrapResult(await this._gddService.getGddForecast(req.user.userId));
  }
}

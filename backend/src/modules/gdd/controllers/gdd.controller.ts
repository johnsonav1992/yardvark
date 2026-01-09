import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { GddService } from '../services/gdd.service';

@Controller('gdd')
export class GddController {
  constructor(private readonly _gddService: GddService) {}

  @Get('current')
  public getCurrentGdd(@Req() req: Request) {
    return this._gddService.getCurrentGdd(req.user.userId);
  }

  @Get('historical')
  public getHistoricalGdd(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this._gddService.getHistoricalGdd(
      req.user.userId,
      startDate,
      endDate,
    );
  }

  @Get('forecast')
  public getGddForecast(@Req() req: Request) {
    return this._gddService.getGddForecast(req.user.userId);
  }
}

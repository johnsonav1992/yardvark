import { Controller, Get, Query } from '@nestjs/common';
import { GddService } from '../services/gdd.service';
import { unwrapResult } from '../../../utils/unwrapResult';
import { User } from '../../../decorators/user.decorator';

@Controller('gdd')
export class GddController {
  constructor(private readonly _gddService: GddService) {}

  @Get('current')
  public async getCurrentGdd(@User('userId') userId: string) {
    return unwrapResult(await this._gddService.getCurrentGdd(userId));
  }

  @Get('historical')
  public async getHistoricalGdd(
    @User('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return unwrapResult(
      await this._gddService.getHistoricalGdd(userId, startDate, endDate),
    );
  }

  @Get('forecast')
  public async getGddForecast(@User('userId') userId: string) {
    return unwrapResult(await this._gddService.getGddForecast(userId));
  }
}

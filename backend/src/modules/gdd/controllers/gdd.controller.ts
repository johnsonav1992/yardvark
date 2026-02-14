import { Controller, Get, Query } from '@nestjs/common';
import { GddService } from '../services/gdd.service';
import { resultOrThrow } from '../../../utils/unwrapResult';
import { User } from '../../../decorators/user.decorator';
import { LogHelpers } from '../../../logger/logger.helpers';

@Controller('gdd')
export class GddController {
  constructor(private readonly _gddService: GddService) {}

  @Get('current')
  public async getCurrentGdd(@User('userId') userId: string) {
    LogHelpers.addBusinessContext('controller_operation', 'get_current_gdd');
    LogHelpers.addBusinessContext('user_id', userId);

    return resultOrThrow(await this._gddService.getCurrentGdd(userId));
  }

  @Get('historical')
  public async getHistoricalGdd(
    @User('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'get_historical_gdd');
    LogHelpers.addBusinessContext('user_id', userId);
    LogHelpers.addBusinessContext('start_date', startDate);
    LogHelpers.addBusinessContext('end_date', endDate);

    return resultOrThrow(
      await this._gddService.getHistoricalGdd(userId, startDate, endDate),
    );
  }

  @Get('forecast')
  public async getGddForecast(@User('userId') userId: string) {
    LogHelpers.addBusinessContext('controller_operation', 'get_gdd_forecast');
    LogHelpers.addBusinessContext('user_id', userId);

    return resultOrThrow(await this._gddService.getGddForecast(userId));
  }
}

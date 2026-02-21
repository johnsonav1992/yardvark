import { Controller, Get, Param } from '@nestjs/common';
import { SoilDataService } from '../services/soil-data.service';
import { resultOrThrow } from '../../../utils/resultOrThrow';
import { User } from '../../../decorators/user.decorator';
import { LogHelpers } from '../../../logger/logger.helpers';
import { BusinessContextKeys } from '../../../logger/logger-keys.constants';

@Controller('soil-data')
export class SoilDataController {
  constructor(private readonly _soilDataService: SoilDataService) {}

  @Get('rolling-week')
  public async getRollingWeekSoilData(@User('userId') userId: string) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'get_rolling_week_soil_data',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

    return resultOrThrow(
      await this._soilDataService.fetchRollingWeekSoilData(userId),
    );
  }

  @Get(':date')
  public async getSoilDataForDate(
    @User('userId') userId: string,
    @Param('date') dateStr: string,
  ) {
    LogHelpers.addBusinessContext(
      BusinessContextKeys.controllerOperation,
      'get_soil_data_for_date',
    );
    LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

    return resultOrThrow(
      await this._soilDataService.fetchSoilDataForDate(userId, dateStr),
    );
  }
}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherController } from './controllers/weather.controller';
import { WeatherService } from './services/weather.service';

@Module({
	imports: [HttpModule],
	controllers: [WeatherController],
	providers: [WeatherService]
})
export class WeatherModule {}

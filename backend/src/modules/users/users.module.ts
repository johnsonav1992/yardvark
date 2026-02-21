import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { S3Service } from 'src/modules/s3/s3.service';

@Module({
  imports: [HttpModule],
  controllers: [UsersController],
  providers: [UsersService, S3Service, ConfigService],
})
export class UsersModule {}

import {
  Body,
  Controller,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '../services/users.service';
import { User } from '../Models/user.model';
import { User as AuthUser } from '../../../decorators/user.decorator';
import { imageFileValidator } from 'src/utils/fileUtils';
import { resultOrThrow } from '../../../utils/unwrapResult';
import { LogHelpers } from '../../../logger/logger.helpers';

const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put()
  public async updateUser(
    @AuthUser('userId') userId: string,
    @Body() data: Partial<User>,
  ) {
    LogHelpers.addBusinessContext('controller_operation', 'update_user');
    LogHelpers.addBusinessContext('user_id', userId);

    return resultOrThrow(await this.usersService.updateUser(userId, data));
  }

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadProfilePicture(
    @UploadedFile(imageFileValidator(MAX_PROFILE_PICTURE_SIZE))
    file: Express.Multer.File,
    @AuthUser('userId') userId: string,
  ) {
    LogHelpers.addBusinessContext(
      'controller_operation',
      'upload_profile_picture',
    );
    LogHelpers.addBusinessContext('user_id', userId);

    return resultOrThrow(
      await this.usersService.updateProfilePicture(userId, file),
    );
  }
}

import {
  Body,
  Controller,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '../services/users.service';
import { Request } from 'express';
import { User } from '../Models/user.model';
import { imageFileValidator } from 'src/utils/fileUtils';
import { unwrapResult } from '../../../utils/unwrapResult';

const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put()
  public async updateUser(@Req() req: Request, @Body() data: Partial<User>) {
    const userId = req.user.userId;

    return unwrapResult(await this.usersService.updateUser(userId, data));
  }

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadProfilePicture(
    @UploadedFile(imageFileValidator(MAX_PROFILE_PICTURE_SIZE))
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const userId = req.user.userId;

    return unwrapResult(
      await this.usersService.updateProfilePicture(userId, file),
    );
  }
}

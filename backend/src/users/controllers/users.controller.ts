import { Body, Controller, Put, Req } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { Request } from 'express';
import { User } from '../Models/user.model';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put()
  async updateUser(
    @Req() req: Request,
    @Body() data: Partial<User>,
  ): Promise<any> {
    const userId = req.user.userId;

    return this.usersService.updateUser(userId, data);
  }
}

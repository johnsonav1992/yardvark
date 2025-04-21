import { Body, Controller, Put, Req } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { User } from '@auth0/auth0-angular';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put()
  async updateUser(
    @Req() req: Request,
    @Body() data: Partial<User>,
  ): Promise<any> {
    const userId = req.user.userId;

    console.log(data);

    return this.usersService.updateUser(userId, data);
  }
}

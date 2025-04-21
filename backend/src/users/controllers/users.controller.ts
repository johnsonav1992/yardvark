import { Controller, Put } from '@nestjs/common';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put(':userId')
  async updateUser(userId: string, data: any): Promise<any> {
    return this.usersService.updateUser(userId, data);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './create.user.dto';
import { User } from './user.schema';
import { UpdateUserDto } from './update.user.dto';
import { PasswordLength } from './user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(): Promise<User[]> {
    return await this.usersService.getAllUsers();
  }

  @Get('/get/:id')
  async getOneUser(@Param('id') id: string): Promise<User> {
    return await this.usersService.getOneUser(id);
  }

  @Post()
  async createUser(
    @Body()
    createUserDto: CreateUserDto
  ): Promise<{ token: string }> {
    return await this.usersService.createUser(createUserDto);
  }

  @Put('/update/:id')
  async updateUser(
    @Param('id')
    id: string,
    @Body()
    user: UpdateUserDto
  ): Promise<User> {
    return this.usersService.updateById(id, user);
  }

  @Delete('/delete/:id')
  async deleteUser(
    @Param('id')
    id: string
  ): Promise<User> {
    return this.usersService.deleteById(id);
  }
}

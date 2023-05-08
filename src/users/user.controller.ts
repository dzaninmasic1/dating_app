import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './create.user.dto';
import { User } from './user.schema';
import { UpdateUserDto } from './update.user.dto';
import { LoginUserDto } from './login.user.dto';
import { Request } from 'express';
import { Roles } from './user.enum';
import { Auth } from '../middleware/auth.decorator';
import { ForgotPasswordDto } from './forgot.password.dto';
import { ChangeForgotPasswordDto } from './change.forgot.password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(@Req() req: Request): Promise<User[]> {
    console.log('INSIDE CONTROLLER ', req.user);
    if (req.user.role == Roles.ADMIN)
      return await this.usersService.getAllUsers();
    else throw new UnauthorizedException();
  }

  @Get('/test/all')
  @Auth(Roles.ADMIN)
  async getAllUsersTest(): Promise<User[]> {
    console.log(new Date().toDateString());
    console.log(new Date().toISOString());
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

  @Post('/login')
  async loginUser(
    @Body()
    loginUserDto: LoginUserDto
  ): Promise<{ token: string }> {
    return await this.usersService.loginUser(loginUserDto);
  }

  @Post('/forgot-password')
  async forgotPassword(
    @Body()
    forgotPasswordDto: ForgotPasswordDto
  ): Promise<string> {
    return await this.usersService.forgotPassword(forgotPasswordDto);
  }

  @Post('/change-forgot-password')
  async changeForgotPassword(
    @Body()
    changeForgotPasswordDto: ChangeForgotPasswordDto
  ): Promise<string> {
    return await this.usersService.changeForgotPassword(
      changeForgotPasswordDto
    );
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

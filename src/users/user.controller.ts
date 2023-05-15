import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { ResponsePaginateDto, UserPaginateDto } from './user.paginate.dto';
import { UserRadiusDto } from './user.radius.dto';
import { ChangePasswordDto } from './change.password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @Query()
    paginateDto: UserPaginateDto
  ): Promise<ResponsePaginateDto> {
    return await this.usersService.getAllUsers(paginateDto);
  }

  @Get('/radius')
  async getRadius(
    @Body()
    userRadiusDto: UserRadiusDto
  ): Promise<User[]> {
    return await this.usersService.getRadius(userRadiusDto);
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
    return await this.usersService.updateById(id, user);
  }

  @Put('change-password')
  async updatePassword(
    @Body()
    changePasswordDto: ChangePasswordDto
  ): Promise<string> {
    return await this.usersService.changePassword(changePasswordDto);
  }

  @Delete('/delete/:id')
  async deleteUser(
    @Param('id')
    id: string
  ): Promise<User> {
    return await this.usersService.deleteById(id);
  }
}

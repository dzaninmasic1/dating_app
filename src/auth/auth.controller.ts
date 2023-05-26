import { Body, Controller, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dto/login.user.dto';
import { ForgotPasswordDto } from '../users/dto/forgot.password.dto';
import { ChangeForgotPasswordDto } from '../users/dto/change.forgot.password.dto';
import { ChangePasswordDto } from '../users/dto/change.password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async test() {
    return await this.authService.test();
  }

  @Post('/login')
  async loginUser(
    @Body()
    loginUserDto: LoginUserDto
  ): Promise<{ token: string }> {
    return await this.authService.loginUser(loginUserDto);
  }

  @Post('/forgot-password')
  async forgotPassword(
    @Body()
    forgotPasswordDto: ForgotPasswordDto
  ): Promise<string> {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/change-forgot-password')
  async changeForgotPassword(
    @Body()
    changeForgotPasswordDto: ChangeForgotPasswordDto
  ): Promise<string> {
    return await this.authService.changeForgotPassword(changeForgotPasswordDto);
  }

  @Put('change-password')
  async updatePassword(
    @Body()
    changePasswordDto: ChangePasswordDto
  ): Promise<string> {
    return await this.authService.changePassword(changePasswordDto);
  }
}

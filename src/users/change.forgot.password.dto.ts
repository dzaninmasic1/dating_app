import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ChangeForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter correct email' })
  email: string;

  @IsNotEmpty()
  forgotPasswordToken: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

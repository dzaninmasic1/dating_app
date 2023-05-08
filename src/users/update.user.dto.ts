export class UpdateUserDto {
  name: string;
  email: string;
  password: string;
  role: string;
  forgotPasswordToken: string;
  forgotPasswordTimestamp: string;
}

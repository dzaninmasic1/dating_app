import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsMatchStatus } from '../match.status.decorator';

export class ReactWithUserDto {
  @IsNotEmpty()
  @IsString()
  likedUserId: string;

  @IsNotEmpty()
  @IsString()
  @IsMatchStatus()
  status: string;
}

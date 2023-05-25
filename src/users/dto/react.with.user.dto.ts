import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength
} from 'class-validator';
import { IsMatchStatus } from '../match.status.decorator';

export class ReactWithUserDto {
  @IsNotEmpty()
  @IsString()
  likedUserId: string;

  @IsNotEmpty()
  @IsString()
  @IsMatchStatus()
  status: string;

  @IsOptional()
  @IsString()
  likedPhotoUrl: string;
}

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidationArguments,
  ValidationOptions,
  registerDecorator
} from 'class-validator';
import { Like } from '../users/user.schema';

export interface ResponsePaginateDtoLikes {
  pages: number;
  page: number;
  data: Like[];
}

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

export function IsMatchStatus(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: 'isMatchStatus',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          return Object.values(MatchStatus).includes(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `Invalid match status. Allowed values are: ${Object.values(
            MatchStatus
          ).join(', ')}`;
        }
      }
    });
  };
}

export enum MatchStatus {
  LIKED = 'liked',
  ONE_LIKED = 'one_liked',
  LIKED_BACK = 'liked_back',
  DISLIKED = 'disliked',
  BLOCKED = 'blocked',
  BLOCKED_BACK = 'blocked_back',
  UNBLOCKED = 'unblocked'
}

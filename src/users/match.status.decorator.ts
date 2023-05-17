import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments
} from 'class-validator';
import { MatchStatus } from './match.status.enum';

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

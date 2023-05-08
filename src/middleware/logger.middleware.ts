import {
  Injectable,
  NestMiddleware,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../users/user.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.headers.authorization.includes('Bearer ')) {
      const info = req.headers.authorization.split('Bearer ');
      if (info.length > 1 && info[1]) {
        try {
          const verify = await this.jwtService.verify(info[1]);
          console.log('VERIFIED ID: ', verify.id);
          const user = await this.userService.getOneUser(verify.id);
          console.log('USER: ', user);
          req.user = user;
          next();
        } catch (error) {
          throw new UnauthorizedException();
        }
      } else throw new UnauthorizedException();
    } else {
      throw new UnauthorizedException();
    }
  }
}

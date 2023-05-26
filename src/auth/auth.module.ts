import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import {
  Like,
  LikeSchema,
  Message,
  MessageSchema,
  User,
  UserSchema
} from '../users/user.schema';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/user.service';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { UserRepository } from '../users/user.repository';
import { MailerService } from '../mailer/mailer.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string | number>('JWT_EXPIRE')
        }
      })
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Message.name, schema: MessageSchema }
    ]),
    MailerModule
  ],
  controllers: [AuthController],
  providers: [
    UsersService,
    AuthRepository,
    AuthService,
    UserRepository,
    MailerService
  ],
  exports: [AuthService]
})
export class AuthModule {}

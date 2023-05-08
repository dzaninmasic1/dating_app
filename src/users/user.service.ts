import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { User } from './user.schema';
import { isValidObjectId } from 'mongoose';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './create.user.dto';
import { LoginUserDto } from './login.user.dto';
import { Roles } from './user.enum';
import { MailerService } from '../mailer/mailer.service';
import { ForgotPasswordDto } from './forgot.password.dto';
import { ChangeForgotPasswordDto } from './change.forgot.password.dto';

export const numberOfSalts = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private jwtService: JwtService,
    private mailerService: MailerService
  ) {}

  async getAllUsers(): Promise<User[]> {
    //this.mailerService.sendMail();
    return await this.userRepository.getAllUsers();
  }

  async getOneUser(id: string): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid id parameter');
    }
    const res = await this.userRepository.getOneUser(id);
    if (!res) {
      throw new NotFoundException('User not found');
    }
    return res;
  }

  async createUser(user: CreateUserDto): Promise<{ token: string }> {
    const { email, password } = user;
    const lowercaseEmail = email.toLowerCase();
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser != null) {
      throw new ConflictException('Email already exists!');
    } else {
      const hashedPassword = await bcrypt.hash(password, numberOfSalts);
      const newUser = {
        ...user,
        email: lowercaseEmail,
        password: hashedPassword,
        role: Roles.ADMIN,
        forgotPasswordToken: null,
        forgotPasswordTimestamp: null
      };
      const finalUser = await this.userRepository.createUser(newUser);
      const token = this.jwtService.sign({ id: finalUser._id });
      return { token };
    }
  }

  async loginUser(user: LoginUserDto): Promise<{ token: string }> {
    const { email, password } = user;

    const fetchedUser = await this.userRepository.findByEmail(email);
    console.log(fetchedUser);
    if (!fetchedUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const doesPasswordMatch = await bcrypt.compare(
      password,
      fetchedUser.password
    );
    if (!doesPasswordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ id: fetchedUser._id });
    return { token };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<string> {
    const { email } = forgotPasswordDto;
    const fetchedUser = await this.userRepository.findByEmail(email);
    if (!fetchedUser) {
      throw new UnauthorizedException(
        'Email can only be sent to the original account email.'
      );
    }
    const token = generateRandomString();
    const timestamp = new Date().toISOString();
    const newUser = await this.userRepository.updateRecoveryTokenByEmail(
      fetchedUser.email,
      token,
      timestamp
    );
    const user = await this.userRepository.findByEmail(newUser.email);
    return user.forgotPasswordToken;
  }

  async changeForgotPassword(
    changeForgotPasswordDto: ChangeForgotPasswordDto
  ): Promise<string> {
    const { email, forgotPasswordToken, newPassword } = changeForgotPasswordDto;

    const fetchedUser = await this.userRepository.findByEmail(email);
    if (!fetchedUser) {
      throw new UnauthorizedException('Unable to find user.');
    }

    if (forgotPasswordToken != fetchedUser.forgotPasswordToken) {
      throw new UnauthorizedException('Incorrect recovery token.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, numberOfSalts);
    const doesPasswordMatch = await bcrypt.compare(
      newPassword,
      fetchedUser.password
    );
    if (doesPasswordMatch) {
      throw new UnauthorizedException(
        'Password cannot be the same as the old one!'
      );
    }

    await this.userRepository.updatePassword(email, hashedPassword);
    return 'Password updated!';
  }

  async updateById(id: string, user: Omit<User, '_id'>): Promise<User> {
    return await this.userRepository.updateById(id, user);
  }

  async deleteById(id: string): Promise<User> {
    return await this.userRepository.deleteById(id);
  }
}

function generateRandomString(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

import {
  BadRequestException,
  ConflictException,
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

export const numberOfSalts = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private jwtService: JwtService
  ) {}

  async getAllUsers(): Promise<User[]> {
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
        role: Roles.ADMIN
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

  async updateById(id: string, user: Omit<User, '_id'>): Promise<User> {
    return await this.userRepository.updateById(id, user);
  }

  async deleteById(id: string): Promise<User> {
    return await this.userRepository.deleteById(id);
  }
}

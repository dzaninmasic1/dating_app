import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { Like, User } from './user.schema';
import { isValidObjectId } from 'mongoose';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create.user.dto';
import { LoginUserDto } from './dto/login.user.dto';
import { Roles } from './user.enum';
import { MailerService } from '../mailer/mailer.service';
import { ForgotPasswordDto } from './dto/forgot.password.dto';
import { ChangeForgotPasswordDto } from './dto/change.forgot.password.dto';
import { ResponsePaginateDto, UserPaginateDto } from './dto/user.paginate.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { UserRadiusDto } from './dto/user.radius.dto';
import { ChangePasswordDto } from './dto/change.password.dto';
import { ReactWithUserDto } from './dto/react.with.user.dto';

export const numberOfSalts = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private jwtService: JwtService,
    private mailerService: MailerService
  ) {}

  async getAllUsers(
    paginateDto: UserPaginateDto
  ): Promise<ResponsePaginateDto> {
    //this.mailerService.sendMail();
    const {
      name,
      email,
      role,
      forgotPasswordToken,
      forgotPasswordTimestamp,
      createdAccountTimestamp
    } = paginateDto;
    const whereArray = [];
    if (email) {
      whereArray.push({ email: { $regex: '.*' + email + '.*' } });
    }
    if (name) {
      whereArray.push({ name: { $regex: '.*' + name + '.*' } });
    }
    if (role) {
      whereArray.push({ role: role });
    }
    if (forgotPasswordToken) {
      whereArray.push({
        forgotPasswordToken: forgotPasswordToken
      });
    }
    if (forgotPasswordTimestamp) {
      whereArray.push({
        //forgotPasswordTimestamp: forgotPasswordTimestamp
        forgotPasswordTimestamp: { $lt: forgotPasswordTimestamp }
      });
    }
    if (createdAccountTimestamp) {
      whereArray.push({
        createdAccountTimestamp: createdAccountTimestamp
      });
    }

    return await this.userRepository.getAllUsers(paginateDto, whereArray);
  }

  /* async getAllForLikes(id: string): Promise<User[]> {
    return await this.userRepository.getAllForLike(id);
  }

  async likeUser(id: string, likedUserId: string): Promise<string> {
    if (id === likedUserId) {
      return 'Cannot like yourself.';
    }

    const fetchedUser = await this.userRepository.getOneUser(id);
    const alreadyLiked = fetchedUser.likes.some(
      (like) => like.userId === likedUserId
    );
    if (alreadyLiked) {
      return 'You cannot like the same user twice.';
    }

    return await this.userRepository.likeUser(id, likedUserId);
  }

  async dislikeUser(id: string, dislikedUserId: string): Promise<string> {
    if (id === dislikedUserId) {
      return 'Cannot dislike yourself.';
    }

    const fetchedUser = await this.userRepository.getOneUser(id);
    const alreadyDisliked = fetchedUser.dislikes.some(
      (dislike) => dislike.userId === dislikedUserId
    );
    if (alreadyDisliked) {
      return 'You cannot dislike the same user twice.';
    }

    return await this.userRepository.dislikeUser(id, dislikedUserId);
  } */

  async getAllForLikes(id: string): Promise<User[]> {
    const likes = await this.userRepository.getLikesByUserId(id);
    const excludedUserIds = likes.map((like) => like.users).flat();

    return this.userRepository.getAllForLikes(excludedUserIds, id);
  }

  async reactWithUser(
    id: string,
    reactWithUserDto: ReactWithUserDto
  ): Promise<string> {
    const { likedUserId, status } = reactWithUserDto;
    const matchArray = [id, likedUserId];
    const doesMatchExist = await this.userRepository.findLike(matchArray);
    console.log(doesMatchExist);
    if (!doesMatchExist) {
      const newLike = new Like();
      newLike.users = [id, likedUserId];
      newLike.status = 'one_liked';
      await this.userRepository.reactWithUser(newLike);
      return 'Liked user.';
    } else {
      if (doesMatchExist.users[0] === id) {
        return 'Cannot like the same user twice.';
      } else {
        const like = new Like();
        like.users = [id, likedUserId];
        like.status = 'liked_back';
        await this.userRepository.updateReaction(
          doesMatchExist._id.toString(),
          like
        );
        return 'User liked back.';
      }
    }
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
    const conditionArray = [];
    conditionArray.push({ email });
    const existingUser = await this.userRepository.findBy(conditionArray);
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
        forgotPasswordTimestamp: null,
        createdAccountTimestamp: new Date().toISOString(),
        location: {
          type: 'Point',
          coordinates: [43.85643, 18.413029]
        }
      };
      const finalUser = await this.userRepository.createUser(newUser);
      const token = this.jwtService.sign({ id: finalUser._id });
      return { token };
    }
  }

  async getRadius(userRadiusDto: UserRadiusDto): Promise<User[]> {
    return await this.userRepository.getUsersWithinRadius(userRadiusDto);
  }

  async loginUser(user: LoginUserDto): Promise<{ token: string }> {
    const { email, password } = user;
    const conditionArray = [{ email }];
    const fetchedUser = await this.userRepository.findBy(conditionArray);
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
    const conditionArray = [{ email }];
    const fetchedUser = await this.userRepository.findBy(conditionArray);
    if (!fetchedUser) {
      throw new UnauthorizedException(
        'Email can only be sent to the original account email.'
      );
    }
    const token = generateRandomString();
    const timestamp = new Date().toISOString();
    const newUser = await this.userRepository.updateRecoveryTokenByEmail({
      id: fetchedUser._id.toString(),
      token,
      timestamp
    });
    const user = await this.userRepository.findBy(conditionArray);
    return user.forgotPasswordToken;
  }

  async updateRecoveryTokenByEmail(
    email: string,
    token: string,
    timestamp: string
  ): Promise<string> {
    const conditionArray = [{ email }];
    const user = await this.userRepository.findBy(conditionArray);
    await this.userRepository.updateRecoveryTokenByEmail({
      id: user._id.toString(),
      token,
      timestamp
    });
    return 'Updated!';
  }

  async changeForgotPassword(
    changeForgotPasswordDto: ChangeForgotPasswordDto
  ): Promise<string> {
    const { email, forgotPasswordToken, newPassword } = changeForgotPasswordDto;
    const conditionArray = [{ email }];
    const fetchedUser = await this.userRepository.findBy(conditionArray);
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

    await this.userRepository.updatePassword({
      id: fetchedUser._id.toString(),
      password: hashedPassword
    });
    return 'Password updated!';
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<string> {
    const { email, oldPassword, newPassword, confirmNewPassword } =
      changePasswordDto;

    const conditionArray = [{ email }];
    const fetchedUser = await this.userRepository.findBy(conditionArray);

    const doesPasswordMatch = await bcrypt.compare(
      oldPassword,
      fetchedUser.password
    );

    if (!fetchedUser) {
      throw new UnauthorizedException('Unable to find user.');
    }
    if (!doesPasswordMatch) {
      throw new UnauthorizedException('Old password does not match.');
    }
    if (newPassword !== confirmNewPassword) {
      throw new UnauthorizedException('New passwords do not match.');
    }

    const isNewSameAsOld = await bcrypt.compare(
      newPassword,
      fetchedUser.password
    );
    if (isNewSameAsOld) {
      throw new UnauthorizedException(
        'New password cannot be the same as older passwords'
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, numberOfSalts);
    await this.userRepository.updatePassword({
      id: fetchedUser._id.toString(),
      password: hashedPassword
    });
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

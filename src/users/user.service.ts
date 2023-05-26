import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { Like, LikeWithId, User, UserWithId } from './user.schema';
import mongoose, { isValidObjectId } from 'mongoose';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create.user.dto';
import { LoginUserDto } from './dto/login.user.dto';
import { Roles } from './user.enum';
import { MailerService } from '../mailer/mailer.service';
import { ForgotPasswordDto } from './dto/forgot.password.dto';
import { ChangeForgotPasswordDto } from './dto/change.forgot.password.dto';
import {
  PaginateDto,
  ResponsePaginateDto,
  ResponsePaginateDtoLikes,
  ResponsePaginateDtoMessages,
  UserPaginateDto
} from './dto/user.paginate.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { UserRadiusDto } from './dto/user.radius.dto';
import { ChangePasswordDto } from './dto/change.password.dto';
import { ReactWithUserDto } from './dto/react.with.user.dto';
import { MatchStatus } from './match.status.enum';
import { MessageDto } from './dto/message.dto';

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
    const likes = await this.userRepository.getLikesByUserId(id);
    const excludedUserIds = likes.map((like) => like.users).flat();

    return this.userRepository.getAllForLikes(excludedUserIds, id);
  } */

  /*   async reactWithUser(
    id: string,
    reactWithUserDto: ReactWithUserDto
  ): Promise<string> {
    const { likedUserId, status } = reactWithUserDto;
    const matchArray = [id, likedUserId];
    const doesMatchExist = await this.userRepository.findLike(matchArray);
    if (!doesMatchExist) {
      const newLike = new Like();

      if (status === MatchStatus.LIKED) {
        newLike.users = [id, likedUserId];
        newLike.status = 'one_liked';
      } else if (status === MatchStatus.DISLIKED) {
        newLike.users = [id, likedUserId];
        newLike.status = 'disliked';
      } else {
        return 'Impossible scenario';
      }

      await this.userRepository.reactWithUser(newLike);
      return 'Reaction saved.';
    } else {
      //CHECK IF STATUS IS DISLIKED AND FORBID ANYTHING IF IT IS
      if (
        doesMatchExist.status === MatchStatus.DISLIKED ||
        (doesMatchExist.status === 'one_liked' &&
          doesMatchExist.users[0] === id &&
          status !== MatchStatus.BLOCKED) ||
        (doesMatchExist.status === 'liked_back' &&
          doesMatchExist.users[0] === id &&
          status !== MatchStatus.BLOCKED) ||
        (doesMatchExist.users[1] === id && status !== MatchStatus.BLOCKED) ||
        (doesMatchExist.users[1] === id &&
          status !== MatchStatus.UNBLOCKED &&
          doesMatchExist.status !== MatchStatus.BLOCKED_BACK)
      ) {
        return 'Forbidden action!';
      }
      //CHECK IF USER WHO BLOCKED TRIES TO DO ANYTHING OTHER THAN UNBLOCK
      if (
        (doesMatchExist.status === MatchStatus.BLOCKED_BACK &&
          doesMatchExist.users[1] === id &&
          status !== MatchStatus.UNBLOCKED) ||
        (doesMatchExist.status === MatchStatus.BLOCKED &&
          doesMatchExist.users[0] === id &&
          status !== MatchStatus.UNBLOCKED)
      ) {
        return 'Cannot do anything. You need to unblock the user first!';
      }
      //BLOCK CHECK
      if (
        (doesMatchExist.status === MatchStatus.BLOCKED_BACK &&
          doesMatchExist.users[0] === id) ||
        (doesMatchExist.status === MatchStatus.BLOCKED &&
          doesMatchExist.users[1] === id)
      ) {
        return 'Cannot do anything. You are blocked!';
      }
      //UNBLOCK USER
      if (
        (doesMatchExist.users[0] === id && status === MatchStatus.UNBLOCKED) ||
        (doesMatchExist.users[1] === id &&
          status === MatchStatus.UNBLOCKED &&
          doesMatchExist.status === MatchStatus.BLOCKED_BACK)
      ) {
        const like = new Like();
        like.users = [id, likedUserId];
        like.status = 'liked';
        await this.userRepository.updateReaction(
          doesMatchExist._id.toString(),
          like
        );
        return 'User unblocked.';
      }
      //LIKE/DISLIKE TWICE CHECK
      if (doesMatchExist.users[0] === id && status === MatchStatus.LIKED) {
        return 'Cannot like/dislike the same user twice.';
      } else {
        const like = new Like();
        if (status === MatchStatus.DISLIKED) {
          like.users = [id, likedUserId];
          like.status = 'disliked';
        } else if (status === MatchStatus.BLOCKED) {
          if (doesMatchExist.users[0] == id) {
            like.users = [id, likedUserId];
            like.status = 'blocked';
          } else {
            like.users = [id, likedUserId];
            like.status = 'blocked_back';
          }
        } else if (status === MatchStatus.LIKED) {
          like.users = [id, likedUserId];
          like.status = 'liked_back';
        } else {
          return 'Impossible scenario';
        }

        await this.userRepository.updateReaction(
          doesMatchExist._id.toString(),
          like
        );
        return 'User saved (Updated).';
      }
    }
  } */

  async sendMessage(likeId: string, messageDto: MessageDto): Promise<void> {
    const { from, to, message } = messageDto;
    const doesConversationExist = await this.userRepository.findMessage(likeId);
    const findLike = await this.userRepository.findLikeById(likeId);

    const arr = [from, to];

    if (!doesConversationExist) {
      if (
        findLike.status === MatchStatus.ONE_LIKED &&
        arr.includes(findLike.users[0].toString()) &&
        arr.includes(findLike.users[1].toString())
      ) {
        if (message === 'test url' && arr[0] === findLike.users[0].toString()) {
          const newMessage = {
            likeId: Object(likeId),
            from,
            to,
            message
          };
          const test = await this.userRepository.createMessage(newMessage);
          console.log(test);
        } else {
          throw new UnauthorizedException('Not a picture! / Cannot do that!');
        }
      } else {
        throw new UnauthorizedException('1');
      }
    } else if (doesConversationExist) {
      if (findLike.status === MatchStatus.ONE_LIKED) {
        const count = await this.userRepository.countMessages(likeId);
        if (count < 2 && doesConversationExist.from === from) {
          const newMessage = {
            likeId: Object(likeId),
            from,
            to,
            message
          };
          const test = await this.userRepository.createMessage(newMessage);
          console.log(test);
        } else {
          throw new UnauthorizedException('Cannot send more than 2 messages!');
        }
      } else if (findLike.status === MatchStatus.LIKED_BACK) {
        const messages = await this.userRepository.getFirstFiveMessages(likeId);
        const count = await this.userRepository.countMessages(likeId);
        let doesMessageExist = false;
        messages.forEach((message) => {
          if (message.from === from) {
            doesMessageExist = true;
            return;
          }
        });

        if (count <= 2 && doesMessageExist === false) {
          if (message === 'test url') {
            const newMessage = {
              likeId: Object(likeId),
              from,
              to,
              message
            };
            const test = await this.userRepository.createMessage(newMessage);
            console.log(test);
          } else {
            throw new UnauthorizedException('Not a picture!');
          }
        } else {
          const newMessage = {
            likeId: Object(likeId),
            from,
            to,
            message
          };
          const test = await this.userRepository.createMessage(newMessage);
          console.log(test);
        }
      } else {
        throw new UnauthorizedException('3');
      }
    } else {
      throw new UnauthorizedException('4');
    }
  }

  async getConversation(
    likeId: string,
    paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoMessages> {
    return await this.userRepository.getConversation(likeId, paginateDto);
  }

  async getBothLikes(
    id: string,
    paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoLikes> {
    const newId = new mongoose.Types.ObjectId(id);
    const likes = await this.userRepository.getBothLikes(newId, paginateDto);
    const pages = likes.pages;
    const page = likes.page;

    const newTestArray = [];
    likes.data.forEach((item) => {
      newTestArray.push(item.users[1], item.status);
    });

    const dataToReturn = {
      pages,
      page,
      data: newTestArray
    };

    return dataToReturn;
  }

  async getLikes(
    id: string,
    paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoLikes> {
    const newId = new mongoose.Types.ObjectId(id);
    const likes = await this.userRepository.getLikes(newId, paginateDto);
    const pages = likes.pages;
    const page = likes.page;

    const newTestArray = [];
    likes.data.forEach((item) => {
      newTestArray.push(item.users[1], item.status);
    });

    const dataToReturn = {
      pages,
      page,
      data: newTestArray
    };

    return dataToReturn;
  }

  async getLikeRequests(
    id: string,
    paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoLikes> {
    const newId = new mongoose.Types.ObjectId(id);
    const likes = await this.userRepository.getLikeRequests(newId, paginateDto);
    const pages = likes.pages;
    const page = likes.page;

    const newTestArray = [];
    likes.data.forEach((item) => {
      newTestArray.push(item.users[0], item.status);
    });

    const dataToReturn = {
      pages,
      page,
      data: newTestArray
    };

    return dataToReturn;
  }

  async getBlocked(
    id: string,
    paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoLikes> {
    const newId = new mongoose.Types.ObjectId(id);
    const likes = await this.userRepository.getBlocked(newId, paginateDto);
    const pages = likes.pages;
    const page = likes.page;

    const newTestArray = [];
    likes.data.forEach((item) => {
      newTestArray.push(item.users[1], item.status);
    });

    const dataToReturn = {
      pages,
      page,
      data: newTestArray
    };

    return dataToReturn;
  }

  async reactWithUser(
    id: string,
    reactWithUserDto: ReactWithUserDto
  ): Promise<string> {
    let like: LikeWithId;
    if (
      reactWithUserDto.status === MatchStatus.LIKED &&
      reactWithUserDto.likedPhotoUrl != null
    ) {
      const { likedUserId, likedPhotoUrl } = reactWithUserDto;
      const messageDto = {
        from: id,
        to: likedUserId,
        message: likedPhotoUrl
      };
      try {
        like = await this.like(id, likedUserId);
        console.log('STATUS ', like.status);
        await this.sendMessage(like._id.toString(), messageDto);
        return 'Reaction saved';
      } catch {
        console.log('LIKE STATUS: ', like.status);
        if (like.status === MatchStatus.ONE_LIKED) {
          await this.userRepository.deleteLike(like._id.toString());
          throw new UnauthorizedException('Not a picture! (1)');
        } else if (like.status === MatchStatus.LIKED_BACK) {
          const likeToUpdate = new Like();
          likeToUpdate.status = MatchStatus.ONE_LIKED;
          await this.userRepository.updateReaction(
            like._id.toString(),
            likeToUpdate
          );
          throw new UnauthorizedException('Not a picture! (2)');
        } else {
          throw new UnauthorizedException('How did you get here?');
        }
      }
    } else if (reactWithUserDto.status === MatchStatus.DISLIKED) {
      return await this.dislike(id, reactWithUserDto.likedUserId);
    } else if (reactWithUserDto.status === MatchStatus.BLOCKED) {
      return await this.block(id, reactWithUserDto.likedUserId);
    } else if (reactWithUserDto.status === MatchStatus.UNBLOCKED) {
      return await this.unblock(id, reactWithUserDto.likedUserId);
    } else {
      throw new UnauthorizedException();
    }
  }

  async like(id: string, likedUserId: string): Promise<LikeWithId> {
    const matchArray = [id, likedUserId];
    const doesMatchExist = await this.userRepository.findLike(matchArray);
    const like = new Like();

    const newId = new mongoose.Types.ObjectId(id);
    const newlikedUserId = new mongoose.Types.ObjectId(likedUserId);

    if (!doesMatchExist) {
      like.users = [newId, newlikedUserId];
      like.status = MatchStatus.ONE_LIKED;
      return await this.userRepository.reactWithUser(like);
      //return 'Reaction saved';
    } else {
      if (
        doesMatchExist.users[1].toString() === newId.toString() &&
        doesMatchExist.status === MatchStatus.ONE_LIKED
      ) {
        like.status = MatchStatus.LIKED_BACK;
        return await this.userRepository.updateReaction(
          doesMatchExist._id.toString(),
          like
        );

        //return 'Reaction saved (LIKED BACK)';
      } else {
        throw new UnauthorizedException('11');
      }
    }
  }

  async dislike(id: string, likedUserId: string): Promise<string> {
    const matchArray = [id, likedUserId];
    const doesMatchExist = await this.userRepository.findLike(matchArray);
    const like = new Like();

    const newId = new mongoose.Types.ObjectId(id);
    const newlikedUserId = new mongoose.Types.ObjectId(likedUserId);

    if (!doesMatchExist) {
      like.users = [newId, newlikedUserId];
      like.status = MatchStatus.DISLIKED;
      await this.userRepository.reactWithUser(like);
      return 'Reaction saved';
    } else {
      if (
        doesMatchExist.users[1].toString() === newId.toString() &&
        doesMatchExist.status === MatchStatus.ONE_LIKED
      ) {
        like.users = [newId, newlikedUserId];
        like.status = MatchStatus.DISLIKED;
        await this.userRepository.updateReaction(
          doesMatchExist._id.toString(),
          like
        );
        return 'Reaction saved (DISLIKED BACK)';
      } else {
        throw new UnauthorizedException();
      }
    }
  }

  async block(id: string, likedUserId: string): Promise<string> {
    const matchArray = [id, likedUserId];
    const doesMatchExist = await this.userRepository.findLike(matchArray);
    const like = new Like();

    const newId = new mongoose.Types.ObjectId(id);
    const newlikedUserId = new mongoose.Types.ObjectId(likedUserId);

    if (doesMatchExist) {
      if (
        doesMatchExist.status === MatchStatus.ONE_LIKED ||
        doesMatchExist.status === MatchStatus.LIKED_BACK
      ) {
        if (doesMatchExist.users[0].toString() === newId.toString()) {
          like.status = MatchStatus.BLOCKED;
        } else {
          like.status = MatchStatus.BLOCKED_BACK;
        }
        await this.userRepository.updateReaction(
          doesMatchExist._id.toString(),
          like
        );
        return 'Reaction saved (BLOCKED / BLOCKED BACK)';
      } else {
        throw new UnauthorizedException();
      }
    } else {
      throw new UnauthorizedException();
    }
  }

  async unblock(id: string, likedUserId: string): Promise<string> {
    const matchArray = [id, likedUserId];
    const doesMatchExist = await this.userRepository.findLike(matchArray);
    const like = new Like();

    const newId = new mongoose.Types.ObjectId(id);
    const newlikedUserId = new mongoose.Types.ObjectId(likedUserId);

    const whereArray = [];
    whereArray.push({ message: { $regex: '.*' + 'test url' + '.*' } });
    whereArray.push({ likeId: doesMatchExist._id.toString() });

    if (doesMatchExist) {
      console.log(doesMatchExist);
      console.log(doesMatchExist.users[0].toString() === newId.toString());
      if (
        doesMatchExist.status === MatchStatus.BLOCKED &&
        doesMatchExist.users[0].toString() === newId.toString()
      ) {
        const links = await this.userRepository.getPhotoLinks(whereArray);
        console.log('PHOTO URLS: ', links);
        await this.userRepository.deleteMessages(doesMatchExist._id.toString());
      } else if (
        doesMatchExist.status === MatchStatus.BLOCKED_BACK &&
        doesMatchExist.users[1].toString() === newId.toString()
      ) {
        const links = await this.userRepository.getPhotoLinks(whereArray);
        console.log('PHOTO URLS: ', links);
        await this.userRepository.deleteMessages(doesMatchExist._id.toString());
      } else {
        throw new UnauthorizedException();
      }
      await this.userRepository.deleteLike(doesMatchExist._id.toString());
      return 'Reaction saved (UNBLOCKED)';
    } else {
      throw new UnauthorizedException();
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

  async findUserBy(conditionArray: any[]): Promise<UserWithId> {
    return await this.userRepository.findBy(conditionArray);
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

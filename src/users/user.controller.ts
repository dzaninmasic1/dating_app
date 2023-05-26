import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create.user.dto';
import { User } from './user.schema';
import { UpdateUserDto } from './dto/update.user.dto';
import {
  PaginateDto,
  ResponsePaginateDto,
  ResponsePaginateDtoLikes,
  ResponsePaginateDtoMessages,
  UserPaginateDto
} from './dto/user.paginate.dto';
import { UserRadiusDto } from './dto/user.radius.dto';
import { ReactWithUserDto } from './dto/react.with.user.dto';
import { MessageDto } from './dto/message.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @Query()
    paginateDto: UserPaginateDto
  ): Promise<ResponsePaginateDto> {
    return await this.usersService.getAllUsers(paginateDto);
  }

  /* @Get('/for-like/:id')
  async getAllForLikes(@Param('id') id: string): Promise<User[]> {
    return await this.usersService.getAllForLikes(id);
  }

  @Put('/:id/like/:likedUserId')
  async likeUser(
    @Param('id') id: string,
    @Param('likedUserId') likedUserId: string
  ): Promise<string> {
    return await this.usersService.likeUser(id, likedUserId);
  }

  @Put('/:id/dislike/:dislikedUserId')
  async dislikeUser(
    @Param('id') id: string,
    @Param('dislikedUserId') dislikedUserId: string
  ): Promise<string> {
    return await this.usersService.dislikeUser(id, dislikedUserId);
  } */

  /* @Get('/for-like/:id')
  async getAllForLikes(@Param('id') id: string): Promise<User[]> {
    return await this.usersService.getAllForLikes(id);
  } */

  @Post('/message/:likeId')
  async sendMessage(
    @Param('likeId') likeId: string,
    @Body() messageDto: MessageDto
  ): Promise<void> {
    return await this.usersService.sendMessage(likeId, messageDto);
  }

  @Get('/get-conversation/:likeId')
  async getConversation(
    @Param('likeId') likeId: string,
    @Query() paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoMessages> {
    return await this.usersService.getConversation(likeId, paginateDto);
  }

  @Get('/get-both-likes/:id')
  async getBothLikes(
    @Param('id') id: string,
    @Query() paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoLikes> {
    return await this.usersService.getBothLikes(id, paginateDto);
  }

  @Get('/get-likes/:id')
  async getLikes(
    @Param('id') id: string,
    @Query() paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoLikes> {
    return await this.usersService.getLikes(id, paginateDto);
  }

  @Get('/get-like-requests/:id')
  async getLikeRequests(
    @Param('id') id: string,
    @Query() paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoLikes> {
    return await this.usersService.getLikeRequests(id, paginateDto);
  }

  @Get('/get-blocked/:id')
  async getBlocked(
    @Param('id') id: string,
    @Query() paginateDto: PaginateDto
  ): Promise<ResponsePaginateDtoLikes> {
    return await this.usersService.getBlocked(id, paginateDto);
  }

  @Post('/react/:id')
  async reactWithUser(
    @Param('id') id: string,
    @Body() reactWithUserDto: ReactWithUserDto
  ): Promise<string> {
    return await this.usersService.reactWithUser(id, reactWithUserDto);
  }

  @Get('/radius')
  async getRadius(
    @Body()
    userRadiusDto: UserRadiusDto
  ): Promise<User[]> {
    return await this.usersService.getRadius(userRadiusDto);
  }

  @Get('/get/:id')
  async getOneUser(@Param('id') id: string): Promise<User> {
    return await this.usersService.getOneUser(id);
  }

  @Post()
  async createUser(
    @Body()
    createUserDto: CreateUserDto
  ): Promise<{ token: string }> {
    return await this.usersService.createUser(createUserDto);
  }

  @Put('/update/:id')
  async updateUser(
    @Param('id')
    id: string,
    @Body()
    user: UpdateUserDto
  ): Promise<User> {
    return await this.usersService.updateById(id, user);
  }

  @Delete('/delete/:id')
  async deleteUser(
    @Param('id')
    id: string
  ): Promise<User> {
    return await this.usersService.deleteById(id);
  }
}

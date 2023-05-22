import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeWithId, User, UserWithId } from './user.schema';
import mongoose, { Model } from 'mongoose';
import { ResponsePaginateDto, UserPaginateDto } from './dto/user.paginate.dto';
import { UserRadiusDto } from './dto/user.radius.dto';

export class UserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Like.name) private likeModel: Model<Like>
  ) {}

  async getAllUsers(
    paginateDto: UserPaginateDto,
    whereArray: any[]
  ): Promise<ResponsePaginateDto> {
    const { limit, page, sort, sortBy } = paginateDto;
    const whereCondition =
      whereArray.length > 0
        ? {
            $and: [...whereArray]
          }
        : {};
    const count = await this.userModel.find(whereCondition).count();
    let numberOfPages: number;

    if (limit < 1) {
      numberOfPages = 1;
    } else {
      numberOfPages = Math.ceil(count / limit);
    }

    const data = await this.userModel
      .find(whereCondition)
      .sort({ [`${sortBy}`]: sort === 1 ? 1 : -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    return {
      pages: numberOfPages,
      page: limit < 1 ? 1 : page,
      data
    };
  }

  /* async getAllForLike(id: string): Promise<User[]> {
    const fetchedUser = await this.userModel
      .findById(id)
      .select('likes.userId dislikes.userId');

    const excludedUserIds = [
      ...fetchedUser.likes.map((like) => like.userId),
      ...fetchedUser.dislikes.map((dislike) => dislike.userId)
    ];

    return await this.userModel.find({
      _id: { $ne: id, $nin: excludedUserIds }
    });
  }

  async likeUser(id: string, likedUserId: string): Promise<string> {
    await this.userModel.findByIdAndUpdate(id, {
      $push: { likes: { userId: likedUserId } }
    });
    return 'User liked!';
  }

  async dislikeUser(id: string, dislikedUserId: string): Promise<string> {
    await this.userModel.findByIdAndUpdate(id, {
      $push: { dislikes: { userId: dislikedUserId } }
    });
    return 'User disliked!';
  } */

  async getLikesByUserId(id: string): Promise<Like[]> {
    return this.likeModel.find({ users: id }).exec();
  }

  async getAllForLikes(excludedUserIds: string[], id: string): Promise<User[]> {
    return this.userModel
      .find({ _id: { $nin: excludedUserIds, $ne: id } })
      .exec();
  }

  async getLikes(id: mongoose.Types.ObjectId): Promise<Like[]> {
    return await this.likeModel
      .find({
        'users.0': id,
        status: { $in: ['one_liked', 'liked_back'] }
      })
      .populate('users', 'name email')
      .select('status');
  }

  async getLikeRequests(id: mongoose.Types.ObjectId): Promise<Like[]> {
    return await this.likeModel
      .find({
        users: { $in: [id] },
        status: { $in: ['one_liked'] }
      })
      .populate('users', 'name email')
      .select('status')
      .exec();
  }

  async getBlocked(id: mongoose.Types.ObjectId): Promise<Like[]> {
    return await this.likeModel
      .find({
        users: { $in: [id] },
        status: { $in: ['blocked'] }
      })
      .populate('users', 'name email')
      .select('status')
      .exec();
  }

  async reactWithUser(like: Like): Promise<Like> {
    return await this.likeModel.create(like);
  }

  async findLike(users: string[]): Promise<LikeWithId> {
    return await this.likeModel.findOne({
      users: { $all: users }
    });
  }

  async updateReaction(id: string, like: Like): Promise<Like> {
    return await this.likeModel.findByIdAndUpdate(id, like);
  }

  async getOneUser(id: string): Promise<User> {
    return await this.userModel.findById(id);
  }

  async findBy(findBy: any[]): Promise<UserWithId> {
    return await this.userModel.findOne({ $and: [...findBy] }).exec();
  }

  async createUser(user: User): Promise<UserWithId> {
    return await this.userModel.create(user);
  }

  async updateById(id: string, user: Omit<User, '_id'>): Promise<User> {
    return await this.userModel.findByIdAndUpdate(id, user, {
      new: true,
      runValidators: true
    });
  }

  async updatePassword({
    id,
    password
  }: {
    id: string;
    password: string;
  }): Promise<User> {
    const newPassword = { password: password };
    return await this.userModel.findByIdAndUpdate(id, newPassword);
  }

  async updateRecoveryTokenByEmail({
    id,
    token,
    timestamp
  }: {
    id: string;
    token: string;
    timestamp: string;
  }): Promise<User> {
    const updatedToken = {
      forgotPasswordToken: token,
      forgotPasswordTimestamp: timestamp
    };
    console.log('ID: ', id);
    return await this.userModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      updatedToken
    );
  }

  async deleteById(id: string): Promise<User> {
    return await this.userModel.findByIdAndDelete(id);
  }

  async getUsersWithinRadius(userRadiusDto: UserRadiusDto): Promise<User[]> {
    const { location, radius } = userRadiusDto;

    const users = await this.userModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: location.coordinates },
          distanceField: 'distance',
          maxDistance: radius,
          spherical: true
        }
      }
    ]);

    return users;
  }
}

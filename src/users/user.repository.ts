import { InjectModel } from '@nestjs/mongoose';
import { User, UserWithId } from './user.schema';
import mongoose, { Model } from 'mongoose';
import { ResponsePaginateDto, UserPaginateDto } from './user.paginate.dto';
import { UserRadiusDto } from './user.radius.dto';

export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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

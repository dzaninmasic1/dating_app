import { InjectModel } from '@nestjs/mongoose';
import { User, UserWithId } from './user.schema';
import { Model } from 'mongoose';

export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getAllUsers(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async getOneUser(id: string): Promise<User> {
    return await this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<UserWithId> {
    return await this.userModel.findOne({ email }).exec();
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

  async updatePassword(email: string, password: string): Promise<User> {
    const newPassword = { password: password };
    return await this.userModel.findOneAndUpdate({ email }, newPassword);
  }

  async updateRecoveryTokenByEmail(
    email: string,
    token: string,
    timestamp: string
  ): Promise<User> {
    const updatedToken = {
      forgotPasswordToken: token,
      forgotPasswordTimestamp: timestamp
    };
    return await this.userModel.findOneAndUpdate({ email }, updatedToken);
  }

  async deleteById(id: string): Promise<User> {
    return await this.userModel.findByIdAndDelete(id);
  }
}

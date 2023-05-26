import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/user.schema';
import mongoose, { Model } from 'mongoose';

export class AuthRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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
}

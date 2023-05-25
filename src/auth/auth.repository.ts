import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/user.schema';
import { Model } from 'mongoose';

export class AuthRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
}

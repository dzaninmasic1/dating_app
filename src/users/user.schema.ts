import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type CatDocument = Document<User>;
export type PointDocument = Document<Location>;

@Schema()
export class Location {
  @Prop({ type: String, default: 'Point' })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[];
}

export const LocationSchema = SchemaFactory.createForClass(Location);
@Schema()
export class User {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  role: string;

  @Prop()
  forgotPasswordToken: string;

  @Prop()
  forgotPasswordTimestamp: string;

  @Prop()
  createdAccountTimestamp: string;

  @Prop({ type: LocationSchema, index: '2dsphere' })
  location: Location;
}

export class UserWithId extends User {
  @Prop()
  _id: mongoose.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

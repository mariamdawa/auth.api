import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.userModel.findOne({ email }).select('+password');
  }

  async findOneById(id: string): Promise<User | null | undefined> {
    return this.userModel.findById(id);
  }

  async updateRefreshToken(id: Types.ObjectId, refreshToken: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshToken });
  }
}

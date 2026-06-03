import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/feature/users/schemas/user.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    super(userModel);
  }
}

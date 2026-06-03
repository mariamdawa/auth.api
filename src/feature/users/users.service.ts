import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from 'src/data/repo/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.usersRepository.create(createUserDto);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ email }, { select: '+password' });
  }

  async findOneById(id: string): Promise<User | null | undefined> {
    return this.usersRepository.findOne({ _id: id });
  }

  async updateRefreshToken(id: Types.ObjectId, refreshToken: string | null): Promise<void> {
    await this.usersRepository.updateOne({ _id: id }, { refreshToken });
  }
}

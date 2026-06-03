import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RefreshToken } from '../schemas/refreshToken.schema';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
  ) {}

  async create(
    jti: string,
    hashedToken: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const createdToken = new this.refreshTokenModel({
      jti,
      hashedToken,
      expiresAt,
    });
    return createdToken.save();
  }

  async findOne(jti: string): Promise<RefreshToken | null> {
    return this.refreshTokenModel.findOne({ jti, isRevoked: false }).exec();
  }

  async revoke(id: Types.ObjectId): Promise<void> {
    await this.refreshTokenModel.findByIdAndUpdate(id, { isRevoked: true });
  }
}

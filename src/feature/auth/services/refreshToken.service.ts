import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken } from '../schemas/refreshToken.schema';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
  ) {}

  async create(jti: string, expiresAt: Date): Promise<RefreshToken> {
    const createdToken = new this.refreshTokenModel({
      jti,
      expiresAt,
    });
    return createdToken.save();
  }

  async findOne(jti: string): Promise<RefreshToken | null> {
    return this.refreshTokenModel.findOne({ jti, isRevoked: false }).exec();
  }

  async revoke(jti: string): Promise<void> {
    await this.refreshTokenModel.updateOne({ jti }, { isRevoked: true });
  }
}

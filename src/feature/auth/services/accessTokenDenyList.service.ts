import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccessTokenDenyList } from '../schemas/accessTokenDenyList.schema';

@Injectable()
export class AccessTokenDenyListService {
  constructor(
    @InjectModel(AccessTokenDenyList.name)
    private readonly denyListModel: Model<AccessTokenDenyList>,
  ) {}

  async create(jti: string, expiresAt: Date): Promise<void> {
    const createdToken = new this.denyListModel({ jti, expiresAt });
    await createdToken.save();
  }

  async isDenylisted(jti: string | undefined): Promise<boolean> {
    if (!jti) return false;

    const token = await this.denyListModel.findOne({ jti }).exec();
    return !!token;
  }
}

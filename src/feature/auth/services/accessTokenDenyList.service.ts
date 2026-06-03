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

  async add(jti: string, expiresAt: Date): Promise<void> {
    const createdToken = new this.denyListModel({ jti, expiresAt });
    await createdToken.save();
  }

  async isDenylisted(jti: string): Promise<boolean> {
    const token = await this.denyListModel.findOne({ jti }).exec();
    return !!token;
  }
}

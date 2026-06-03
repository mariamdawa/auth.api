import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    AccessTokenDenyList,
} from 'src/feature/auth/schemas/accessTokenDenyList.schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class AccessTokenDenyListRepository extends BaseRepository<AccessTokenDenyList> {
  constructor(
    @InjectModel(AccessTokenDenyList.name)
    private readonly accessTokenDenyListModel: Model<AccessTokenDenyList>,
  ) {
    super(accessTokenDenyListModel);
  }
}

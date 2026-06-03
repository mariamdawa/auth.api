import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AccessTokenDenyList extends Document {
  @Prop({ required: true, unique: true })
  jti: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const AccessTokenDenyListSchema =
  SchemaFactory.createForClass(AccessTokenDenyList);

AccessTokenDenyListSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

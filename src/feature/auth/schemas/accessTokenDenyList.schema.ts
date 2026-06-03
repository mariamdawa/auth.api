import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AccessTokenDenyList extends Document {
  @Prop({ required: true, unique: true })
  jti!: string;

  @Prop({ required: true, expires: 0 })
  expiresAt!: Date;
}

export const AccessTokenDenyListSchema =
  SchemaFactory.createForClass(AccessTokenDenyList);


import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken extends Document {
  @Prop({ required: true, unique: true })
  jti!: string;

  @Prop({ required: true })
  hashedToken!: string;

  @Prop({ required: true, default: false })
  isRevoked!: boolean;

  @Prop({ required: true })
  expiresAt!: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

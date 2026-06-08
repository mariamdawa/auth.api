import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken extends Document {
  @Prop({ required: true, unique: true })
  jti!: string;

  @Prop({ required: true, default: false })
  isRevoked!: boolean;

  @Prop({ required: true, expires: 0 })
  expiresAt!: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);


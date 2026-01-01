import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Session' })
  session_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Client', required: true })
  client_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  amount_inr: number;

  @Prop({ required: true, enum: ['Cash', 'UPI', 'Bank'] })
  mode: string;

  @Prop({ default: 'Pending', enum: ['Paid', 'Pending'] })
  status: string;

  @Prop()
  paid_at: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  healer_id: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  is_active: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

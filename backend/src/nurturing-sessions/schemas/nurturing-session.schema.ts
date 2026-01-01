import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NurturingSessionDocument = NurturingSession & Document;

@Schema({ timestamps: true })
export class NurturingSession {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  coordinator: string;

  @Prop()
  payment_details: string;

  @Prop({ default: 'Planned', enum: ['Planned', 'Registered', 'Attended'] })
  status: string;

  @Prop()
  recording_available_till: Date;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  healer_id: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  is_active: boolean;
}

export const NurturingSessionSchema = SchemaFactory.createForClass(NurturingSession);

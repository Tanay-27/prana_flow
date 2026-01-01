import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true, enum: ['healing', 'nurturing'] })
  type: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Client' })
  client_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Protocol' }], default: [] })
  protocol_ids: MongooseSchema.Types.ObjectId[];

  @Prop({ required: true })
  scheduled_date: Date;

  @Prop()
  start_time: string;

  @Prop()
  end_time: string;

  @Prop({ default: 'scheduled' })
  status: string;

  @Prop()
  notes: string;

  @Prop({ default: 0 })
  fee: number;

  @Prop({ default: true })
  is_active: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

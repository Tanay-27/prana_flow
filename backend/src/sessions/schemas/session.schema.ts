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

  @Prop({
    type: [
      {
        from_date: { type: Date, required: true },
        to_date: { type: Date, required: true },
        from_time: { type: String, required: true },
        to_time: { type: String, required: true },
      },
    ],
    default: [],
  })
  schedule_slots: {
    from_date: Date;
    to_date: Date;
    from_time: string;
    to_time: string;
  }[];

  @Prop({ default: 'scheduled' })
  status: string;

  @Prop()
  notes: string;

  @Prop({ default: 0 })
  fee: number;

  @Prop({
    type: [
      {
        path: { type: String, required: true },
        original_name: { type: String },
        mime_type: { type: String },
        size: { type: Number },
      },
    ],
    default: [],
  })
  attachments: {
    path: string;
    original_name?: string;
    mime_type?: string;
    size?: number;
  }[];

  @Prop({ default: false })
  self_session: boolean;

  @Prop({ default: true })
  is_active: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

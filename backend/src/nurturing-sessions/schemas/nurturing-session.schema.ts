import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NurturingSessionDocument = NurturingSession & Document;

@Schema({ timestamps: true })
export class NurturingSession {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  date: Date;

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

  @Prop()
  coordinator: string;

  @Prop()
  payment_details: string;

  @Prop({ default: 'Planned', enum: ['Planned', 'Registered', 'Attended'] })
  status: string;

  @Prop()
  recording_available_till: Date;

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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  healer_id: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  is_active: boolean;
}

export const NurturingSessionSchema = SchemaFactory.createForClass(NurturingSession);

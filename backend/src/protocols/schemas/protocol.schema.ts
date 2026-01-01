import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProtocolDocument = Protocol & Document;

@Schema({ timestamps: true })
export class Protocol {
  @Prop({ required: true })
  name: string;

  @Prop()
  notes: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: [String], default: [] })
  attachments: string[]; // URLs/Paths

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  healer_id: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  is_active: boolean;
}

export const ProtocolSchema = SchemaFactory.createForClass(Protocol);

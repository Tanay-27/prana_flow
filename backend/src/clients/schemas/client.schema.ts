import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ _id: false })
class HealingNote {
  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  text: string;
}

const HealingNoteSchema = SchemaFactory.createForClass(HealingNote);

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true })
  name: string;

  @Prop()
  photo: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ type: [HealingNoteSchema], default: [] })
  notes: HealingNote[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Protocol' }], default: [] })
  protocol_ids: MongooseSchema.Types.ObjectId[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: 0 })
  base_fee: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  healer_id: MongooseSchema.Types.ObjectId;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

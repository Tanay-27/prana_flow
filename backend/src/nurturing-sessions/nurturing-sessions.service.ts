import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NurturingSession, NurturingSessionDocument } from './schemas/nurturing-session.schema';

@Injectable()
export class NurturingSessionsService {
  constructor(
    @InjectModel(NurturingSession.name) private model: Model<NurturingSessionDocument>,
  ) {}

  async create(data: any, healerId: string): Promise<NurturingSessionDocument> {
    const session = new this.model({
      ...data,
      healer_id: new Types.ObjectId(healerId),
    });
    return session.save();
  }

  async findAll(healerId: string): Promise<NurturingSessionDocument[]> {
    return this.model.find({ healer_id: new Types.ObjectId(healerId), is_active: true } as any).sort({ date: 1 }).exec();
  }

  async findByRange(healerId: string, start: Date, end: Date): Promise<NurturingSessionDocument[]> {
    return this.model.find({
      healer_id: new Types.ObjectId(healerId),
      date: { $gte: start, $lte: end },
      is_active: true,
    } as any).sort({ date: 1 }).exec();
  }

  async update(id: string, healerId: string, data: any): Promise<NurturingSessionDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId), is_active: true } as any, data, { new: true })
      .exec();
  }

  async remove(id: string, healerId: string): Promise<NurturingSessionDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId) } as any, { is_active: false }, { new: true })
      .exec();
  }
}

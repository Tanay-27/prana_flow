import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Protocol, ProtocolDocument } from './schemas/protocol.schema';

@Injectable()
export class ProtocolsService {
  constructor(
    @InjectModel(Protocol.name) private model: Model<ProtocolDocument>,
  ) {}

  async create(data: any, healerId: string): Promise<ProtocolDocument> {
    const protocol = new this.model({
      ...data,
      healer_id: new Types.ObjectId(healerId),
    });
    return protocol.save();
  }

  async findAll(healerId: string, search?: string): Promise<ProtocolDocument[]> {
    const query: any = { healer_id: new Types.ObjectId(healerId), is_active: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    return this.model.find(query).sort({ name: 1 }).exec();
  }

  async findOne(id: string, healerId: string): Promise<ProtocolDocument | null> {
    return this.model.findOne({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId), is_active: true } as any).exec();
  }

  async update(id: string, healerId: string, data: any): Promise<ProtocolDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId), is_active: true } as any, data, { new: true })
      .exec();
  }

  async remove(id: string, healerId: string): Promise<ProtocolDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId) } as any, { is_active: false }, { new: true })
      .exec();
  }
}

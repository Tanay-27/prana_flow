import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private model: Model<PaymentDocument>,
  ) {}

  async create(data: any, healerId: string): Promise<PaymentDocument> {
    const payment = new this.model({
      ...data,
      healer_id: new Types.ObjectId(healerId),
      session_id: data.session_id ? new Types.ObjectId(data.session_id) : undefined,
      client_id: new Types.ObjectId(data.client_id),
    });
    return payment.save();
  }

  async findAll(healerId: string): Promise<PaymentDocument[]> {
    return this.model.find({ healer_id: new Types.ObjectId(healerId), is_active: true } as any)
      .populate('client_id', 'name')
      .populate('session_id')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByClient(healerId: string, clientId: string): Promise<PaymentDocument[]> {
    return this.model.find({ 
      healer_id: new Types.ObjectId(healerId), 
      client_id: new Types.ObjectId(clientId),
      is_active: true 
    } as any).sort({ createdAt: -1 }).exec();
  }

  async update(id: string, healerId: string, data: any): Promise<PaymentDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId), is_active: true } as any, data, { new: true })
      .exec();
  }

  async remove(id: string, healerId: string): Promise<PaymentDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId) } as any, { is_active: false }, { new: true })
      .exec();
  }
}

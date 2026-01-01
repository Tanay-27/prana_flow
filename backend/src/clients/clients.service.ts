import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client, ClientDocument } from './schemas/client.schema';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
  ) {}

  async create(clientData: any, healerId: string): Promise<ClientDocument> {
    const client = new this.clientModel({
      ...clientData,
      healer_id: new Types.ObjectId(healerId),
    });
    return client.save();
  }

  async findAll(healerId: string, search?: string): Promise<ClientDocument[]> {
    const query: any = { 
      healer_id: new Types.ObjectId(healerId), 
      is_active: true 
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    return this.clientModel.find(query).exec();
  }

  async findOne(id: string, healerId: string): Promise<ClientDocument | null> {
    return this.clientModel.findOne({ 
      _id: new Types.ObjectId(id), 
      healer_id: new Types.ObjectId(healerId),
      is_active: true
    } as any).exec();
  }

  async update(id: string, healerId: string, updateData: any): Promise<ClientDocument | null> {
    // Preserve notes integrity - notes should only be added via addNote
    delete updateData.notes;
    
    return this.clientModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId), is_active: true } as any, 
        updateData, 
        { new: true }
      )
      .exec();
  }

  async softDelete(id: string, healerId: string): Promise<ClientDocument | null> {
    return this.clientModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId) } as any, 
        { is_active: false }, 
        { new: true }
      )
      .exec();
  }

  async addNote(id: string, healerId: string, noteText: string): Promise<ClientDocument | null> {
    return this.clientModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId) } as any,
        { $push: { notes: { text: noteText, timestamp: new Date() } } } as any,
        { new: true }
      )
      .exec();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Protocol, ProtocolDocument } from './schemas/protocol.schema';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProtocolsService {
  constructor(
    @InjectModel(Protocol.name) private model: Model<ProtocolDocument>,
    private readonly storageService: StorageService,
  ) {}

  private async populateUrls(protocol: ProtocolDocument | null): Promise<any> {
    if (!protocol) return null;
    const obj = protocol.toObject();
    if (obj.attachments && obj.attachments.length > 0) {
      obj.attachments = await this.storageService.getFilesUrls(obj.attachments);
    }
    return obj;
  }

  async create(data: any, healerId: string): Promise<any> {
    if (data.attachments) {
      data.attachments = data.attachments.map(a => this.storageService.getPathFromUrl(a));
    }
    const protocol = new this.model({
      ...data,
      healer_id: new Types.ObjectId(healerId),
    });
    const saved = await protocol.save();
    return this.populateUrls(saved);
  }

  async findAll(healerId: string, search?: string, start?: Date, end?: Date): Promise<any[]> {
    const query: any = { healer_id: new Types.ObjectId(healerId), is_active: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (start || end) {
      query.updatedAt = {};
      if (start) {
        query.updatedAt.$gte = start;
      }
      if (end) {
        query.updatedAt.$lte = end;
      }
    }
    const protocols = await this.model.find(query).sort({ name: 1 }).exec();
    return Promise.all(protocols.map(p => this.populateUrls(p)));
  }

  async findOne(id: string, healerId: string): Promise<any | null> {
    const protocol = await this.model.findOne({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId), is_active: true } as any).exec();
    return this.populateUrls(protocol);
  }

  async update(id: string, healerId: string, data: any): Promise<any | null> {
    if (data.attachments) {
      data.attachments = data.attachments.map(a => this.storageService.getPathFromUrl(a));
    }
    const protocol = await this.model
      .findOneAndUpdate({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId), is_active: true } as any, data, { new: true })
      .exec();
    return this.populateUrls(protocol);
  }

  async remove(id: string, healerId: string): Promise<any | null> {
    const protocol = await this.model
      .findOneAndUpdate({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId) } as any, { is_active: false }, { new: true })
      .exec();
    return this.populateUrls(protocol);
  }
}

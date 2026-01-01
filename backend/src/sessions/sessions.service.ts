import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async create(sessionData: any, userId: string): Promise<SessionDocument> {
    const session = new this.sessionModel({
      ...sessionData,
      user_id: new Types.ObjectId(userId),
    });
    return session.save();
  }

  async createRecurring(recurringData: {
    type: 'healing' | 'nurturing';
    client_id?: string;
    protocol_ids?: string[];
    daysOfWeek: number[]; // 0 for Sunday
    startTime: string;
    endTime: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }, userId: string) {
    const sessions: any[] = [];
    const start = new Date(recurringData.startDate);
    const end = new Date(recurringData.endDate);
    const dayMs = 24 * 60 * 60 * 1000;

    for (let current = new Date(start); current <= end; current = new Date(current.getTime() + dayMs)) {
      if (recurringData.daysOfWeek.includes(current.getDay())) {
        sessions.push({
          type: recurringData.type,
          user_id: new Types.ObjectId(userId),
          client_id: recurringData.client_id ? new Types.ObjectId(recurringData.client_id) : undefined,
          protocol_ids: recurringData.protocol_ids?.map(id => new Types.ObjectId(id)) || [],
          scheduled_date: new Date(current),
          start_time: recurringData.startTime,
          end_time: recurringData.endTime,
          status: 'scheduled',
          notes: recurringData.notes,
          fee: (recurringData as any).fee || 0,
        });
      }
    }

    if (sessions.length > 0) {
      return this.sessionModel.insertMany(sessions);
    }
    return [];
  }

  async findByRange(userId: string, start: Date, end: Date): Promise<SessionDocument[]> {
    return this.sessionModel.find({
      user_id: new Types.ObjectId(userId),
      scheduled_date: {
        $gte: start,
        $lte: end,
      },
      is_active: true,
    } as any)
    .populate('client_id', 'name photo')
    .populate('protocol_ids', 'name keywords')
    .sort({ scheduled_date: 1, start_time: 1 })
    .exec();
  }

  async update(id: string, userId: string, updateData: any): Promise<SessionDocument | null> {
    return this.sessionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), user_id: new Types.ObjectId(userId), is_active: true } as any,
        updateData,
        { new: true }
      )
      .exec();
  }

  async delete(id: string, userId: string): Promise<SessionDocument | null> {
    return this.sessionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), user_id: new Types.ObjectId(userId) } as any,
        { is_active: false },
        { new: true }
      )
      .exec();
  }

  async findByClient(userId: string, clientId: string): Promise<SessionDocument[]> {
    return this.sessionModel.find({
      user_id: new Types.ObjectId(userId),
      client_id: new Types.ObjectId(clientId),
      is_active: true,
    } as any)
    .populate('protocol_ids', 'name keywords')
    .sort({ scheduled_date: -1 })
    .exec();
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class SessionsService implements OnModuleInit {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private readonly storageService: StorageService,
  ) {}

  async onModuleInit() {
    try {
      await this.sessionModel.updateMany(
        { type: 'nurturing self' },
        { $set: { type: 'healing', self_session: true } },
      ).exec();
    } catch (error) {
      // swallow cleanup errors to avoid blocking boot
    }
  }

  private normalizeAttachments(raw: any[] = []) {
    return raw
      .filter(Boolean)
      .map((att) => {
        if (typeof att === 'string') {
          return { path: this.storageService.getPathFromUrl(att) };
        }
        return {
          path: att.path || (att.url ? this.storageService.getPathFromUrl(att.url) : undefined),
          original_name: att.original_name || att.name || att.fileName,
          mime_type: att.mime_type || att.type,
          size: att.size,
        };
      })
      .filter((att) => !!att.path);
  }

  private normalizeSlots(slots: any[] = []) {
    return slots
      .map((slot) => {
        if (!slot) return null;
        const fromDate = slot.from_date ? new Date(slot.from_date) : null;
        const toDate = slot.to_date ? new Date(slot.to_date) : null;
        return {
          from_date: fromDate && !isNaN(fromDate.getTime()) ? fromDate : null,
          to_date: toDate && !isNaN(toDate.getTime()) ? toDate : null,
          from_time: slot.from_time,
          to_time: slot.to_time,
        };
      })
      .filter(
        (slot) =>
          slot &&
          slot.from_date &&
          slot.to_date &&
          !!slot.from_time &&
          !!slot.to_time,
      );
  }

  private applyPrimarySlot(sessionData: any, slots: any[]) {
    if (!slots.length) return;
    const primary = slots[0];
    sessionData.schedule_slots = slots;
    sessionData.scheduled_date = sessionData.scheduled_date || primary.from_date;
    sessionData.start_time = sessionData.start_time || primary.from_time;
    sessionData.end_time = sessionData.end_time || primary.to_time;
  }

  private async populateUrls(session: SessionDocument | null): Promise<any> {
    if (!session) return null;
    const sessionObj = session.toObject();
    const attachmentsArray = Array.isArray(sessionObj.attachments) ? sessionObj.attachments : [];
    if (attachmentsArray.length > 0) {
      const normalized = attachmentsArray.map((att: any) =>
        typeof att === 'string' ? { path: att } : att,
      );
      const urls = await Promise.all(
        normalized.map((att: any) => this.storageService.getFileUrl(att.path)),
      );
      sessionObj.attachments = normalized.map((att: any, idx: number) => ({
        ...att,
        url: urls[idx],
      }));
    }
    return sessionObj;
  }

  async create(sessionData: any, userId: string): Promise<any> {
    if (sessionData.attachments) {
      sessionData.attachments = this.normalizeAttachments(sessionData.attachments);
    }
    if (sessionData.schedule_slots) {
      const slots = this.normalizeSlots(sessionData.schedule_slots);
      this.applyPrimarySlot(sessionData, slots);
    }
    const session = new this.sessionModel({
      ...sessionData,
      user_id: new Types.ObjectId(userId),
    });
    const saved = await session.save();
    return this.populateUrls(saved);
  }

  async createRecurring(recurringData: any, userId: string) {
    // Basic sanitization for recurring if needed, but recurring usually starts empty
    const start = new Date(recurringData.startDate);
    const end = new Date(recurringData.endDate);
    const dayMs = 24 * 60 * 60 * 1000;
    const sessions: any[] = [];

    for (let current = new Date(start); current <= end; current = new Date(current.getTime() + dayMs)) {
      if (recurringData.daysOfWeek.includes(current.getDay())) {
        sessions.push({
          ...recurringData,
          user_id: new Types.ObjectId(userId),
          client_id: recurringData.client_id ? new Types.ObjectId(recurringData.client_id) : undefined,
          protocol_ids: recurringData.protocol_ids?.map(id => new Types.ObjectId(id)) || [],
          scheduled_date: new Date(current),
          status: 'scheduled',
          attachments: [], // Recurring starts fresh
        });
      }
    }

    if (sessions.length > 0) {
      return this.sessionModel.insertMany(sessions);
    }
    return [];
  }

  async findByRange(userId: string, start: Date, end: Date): Promise<any[]> {
    const sessions = await this.sessionModel.find({
      user_id: new Types.ObjectId(userId),
      scheduled_date: {
        $gte: start,
        $lte: end,
      },
      is_active: true,
    } as any)
    .populate('client_id', 'name photo')
    .populate('protocol_ids', 'name keywords attachments')
    .sort({ scheduled_date: 1, start_time: 1 })
    .exec();

    return Promise.all(sessions.map(s => this.populateUrls(s)));
  }

  async update(id: string, userId: string, updateData: any): Promise<any | null> {
    if (updateData.attachments) {
      updateData.attachments = this.normalizeAttachments(updateData.attachments);
    }
    if (updateData.schedule_slots) {
      const slots = this.normalizeSlots(updateData.schedule_slots);
      this.applyPrimarySlot(updateData, slots);
    }
    const session = await this.sessionModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), user_id: new Types.ObjectId(userId), is_active: true } as any,
        updateData,
        { new: true }
      )
      .exec();
    
    return this.populateUrls(session);
  }

  async delete(id: string, userId: string): Promise<any | null> {
    const session = await this.sessionModel
       .findOneAndUpdate(
        { _id: new Types.ObjectId(id), user_id: new Types.ObjectId(userId) } as any,
        { is_active: false },
        { new: true }
      )
      .exec();
    return this.populateUrls(session);
  }

  async findByClient(userId: string, clientId: string, start?: Date, end?: Date): Promise<any[]> {
    const match: any = {
      user_id: new Types.ObjectId(userId),
      client_id: new Types.ObjectId(clientId),
      is_active: true,
    };

    if (start || end) {
      match.scheduled_date = {};
      if (start) {
        match.scheduled_date.$gte = start;
      }
      if (end) {
        match.scheduled_date.$lte = end;
      }
    }

    const sessions = await this.sessionModel.find(match as any)
      .populate('protocol_ids', 'name keywords attachments')
      .sort({ scheduled_date: -1 })
      .exec();

    return Promise.all(sessions.map((s) => this.populateUrls(s)));
  }
}

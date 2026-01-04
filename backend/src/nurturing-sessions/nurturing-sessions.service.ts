import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NurturingSession, NurturingSessionDocument } from './schemas/nurturing-session.schema';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class NurturingSessionsService {
  constructor(
    @InjectModel(NurturingSession.name) private model: Model<NurturingSessionDocument>,
    private readonly storageService: StorageService,
  ) {}

  private normalizeAttachments(raw: any[] = []) {
    return raw
      .filter(Boolean)
      .map((att) => {
        if (typeof att === 'string') {
          return { path: att };
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

  private async withAttachmentUrls(session: NurturingSessionDocument | null) {
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

  private async withAttachmentsList(sessions: NurturingSessionDocument[]) {
    return Promise.all(sessions.map((session) => this.withAttachmentUrls(session)));
  }

  async create(data: any, healerId: string): Promise<NurturingSessionDocument> {
    const session = new this.model({
      ...data,
      healer_id: new Types.ObjectId(healerId),
      attachments: data.attachments ? this.normalizeAttachments(data.attachments) : [],
    });
    const saved = await session.save();
    return this.withAttachmentUrls(saved);
  }

  async findAll(healerId: string, start?: Date, end?: Date): Promise<any[]> {
    if (start && end) {
      return this.findByRange(healerId, start, end);
    }
    const sessions = await this.model
      .find({ healer_id: new Types.ObjectId(healerId), is_active: true } as any)
      .sort({ date: 1 })
      .exec();
    return this.withAttachmentsList(sessions);
  }

  async findByRange(healerId: string, start: Date, end: Date): Promise<NurturingSessionDocument[]> {
    const sessions = await this.model
      .find({
        healer_id: new Types.ObjectId(healerId),
        date: { $gte: start, $lte: end },
        is_active: true,
      } as any)
      .sort({ date: 1 })
      .exec();
    return this.withAttachmentsList(sessions);
  }

  async update(id: string, healerId: string, data: any): Promise<NurturingSessionDocument | null> {
    const updatePayload = {
      ...data,
      ...(data.attachments
        ? { attachments: this.normalizeAttachments(data.attachments) }
        : {}),
    };
    const session = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId), is_active: true } as any,
        updatePayload,
        { new: true },
      )
      .exec();
    return this.withAttachmentUrls(session);
  }

  async remove(id: string, healerId: string): Promise<NurturingSessionDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: new Types.ObjectId(id), healer_id: new Types.ObjectId(healerId) } as any, { is_active: false }, { new: true })
      .exec();
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NurturingSessionsService } from './nurturing-sessions.service';
import { NurturingSessionsController } from './nurturing-sessions.controller';
import { NurturingSession, NurturingSessionSchema } from './schemas/nurturing-session.schema';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: NurturingSession.name, schema: NurturingSessionSchema }]),
    StorageModule,
  ],
  providers: [NurturingSessionsService],
  controllers: [NurturingSessionsController],
  exports: [NurturingSessionsService],
})
export class NurturingSessionsModule {}

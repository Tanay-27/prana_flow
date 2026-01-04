import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProtocolsService } from './protocols.service';
import { ProtocolsController } from './protocols.controller';
import { Protocol, ProtocolSchema } from './schemas/protocol.schema';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Protocol.name, schema: ProtocolSchema }]),
    StorageModule,
  ],
  providers: [ProtocolsService],
  controllers: [ProtocolsController],
  exports: [ProtocolsService],
})
export class ProtocolsModule {}

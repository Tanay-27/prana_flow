import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProtocolsService } from './protocols.service';
import { ProtocolsController } from './protocols.controller';
import { Protocol, ProtocolSchema } from './schemas/protocol.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Protocol.name, schema: ProtocolSchema }]),
  ],
  providers: [ProtocolsService],
  controllers: [ProtocolsController],
  exports: [ProtocolsService],
})
export class ProtocolsModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { ProtocolsController } from './protocols.controller';

describe('ProtocolsController', () => {
  let controller: ProtocolsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProtocolsController],
    }).compile();

    controller = module.get<ProtocolsController>(ProtocolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

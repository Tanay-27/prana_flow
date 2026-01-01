import { Test, TestingModule } from '@nestjs/testing';
import { NurturingSessionsController } from './nurturing-sessions.controller';

describe('NurturingSessionsController', () => {
  let controller: NurturingSessionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NurturingSessionsController],
    }).compile();

    controller = module.get<NurturingSessionsController>(NurturingSessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

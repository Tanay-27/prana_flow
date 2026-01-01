import { Test, TestingModule } from '@nestjs/testing';
import { NurturingSessionsService } from './nurturing-sessions.service';

describe('NurturingSessionsService', () => {
  let service: NurturingSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NurturingSessionsService],
    }).compile();

    service = module.get<NurturingSessionsService>(NurturingSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { LawnSegmentsController } from './lawn-segments.controller';

describe('LawnSegmentsController', () => {
  let controller: LawnSegmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LawnSegmentsController],
    }).compile();

    controller = module.get<LawnSegmentsController>(LawnSegmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { ResourceNotFound } from '../../../errors/resource-error';

export class LawnSegmentNotFound extends ResourceNotFound {
  constructor() {
    super({
      message: 'Lawn segment not found',
      code: 'LAWN_SEGMENT_NOT_FOUND',
    });
  }
}

import { Request } from 'express';
import './request'; // Ensure Express Request augmentation is applied

export interface GqlContext {
  req: Request;
}

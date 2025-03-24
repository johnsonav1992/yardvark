declare module 'express' {
  export interface Request {
    user: { userId: string };
  }
}

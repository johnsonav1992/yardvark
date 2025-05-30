declare module 'express' {
  export interface Request {
    user: ExtractedUserRequestData;
  }
}

export type ExtractedUserRequestData = {
  userId: string;
  email: string;
  name: string;
};

export type Auth0TokenPayload = {
  given_name: string;
  family_name: string;
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
  sid: string;
  nonce: string;
};

export type ExtractedUserRequestData = {
  userId: string;
  email: string;
  name: string;
};

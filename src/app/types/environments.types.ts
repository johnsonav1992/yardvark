export type Environment = {
  production?: boolean;
  isStaging?: boolean;
  apiUrl: string;
  feAppUrl: string;
  auth0Domain: string;
  auth0ClientId: string;
  mapBoxPublicKey: string;
};

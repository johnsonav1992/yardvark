import { Environment } from '../app/types/environments.types';

// Staging backend URL for all preview deployments
const STAGING_BE_API_URL = 'https://yardvark-backend-staging.up.railway.app';

function getPreviewFeUrl(): string {
  if (typeof window !== 'undefined') {
    return `https://${window.location.hostname}`;
  }
  return 'https://yardvark.netlify.app'; // fallback
}

export const environment: Environment = {
  production: false,
  isStaging: true,
  apiUrl: STAGING_BE_API_URL,
  feAppUrl: getPreviewFeUrl(),
  auth0Domain: 'dev-w4uj6ulyqeacwtfi.us.auth0.com',
  auth0ClientId: 'QRPi2KnSnV3pEnDiOqE2aN4zeNS8vRM5',
  mapBoxPublicKey:
    'pk.eyJ1Ijoiam9obnNvbmF2IiwiYSI6ImNtOG1mMWE0aDBnbjgyaW9tcWc2c2JhczUifQ.2jMp1pCJKr2RDKIVfXwwNQ',
  stripePublishableKey: 'pk_test_your_publishable_key_here'
};

import { DEV_BE_API_URL } from '../app/constants/api-constants';
import { DEV_FE_URL } from '../app/constants/auth-constants';
import { Environment } from '../app/types/environments.types';

export const environment: Environment = {
  production: false,
  apiUrl: DEV_BE_API_URL,
  feAppUrl: DEV_FE_URL,
  auth0Domain: 'dev-w4uj6ulyqeacwtfi.us.auth0.com',
  auth0ClientId: 'QRPi2KnSnV3pEnDiOqE2aN4zeNS8vRM5',
  mapBoxPublicKey:
    'pk.eyJ1Ijoiam9obnNvbmF2IiwiYSI6ImNtOG1mMWE0aDBnbjgyaW9tcWc2c2JhczUifQ.2jMp1pCJKr2RDKIVfXwwNQ',
  stripePublishableKey: 'pk_test_your_publishable_key_here',
};

import { DEV_BE_API_URL } from '../app/constants/api-constants';
import { DEV_FE_URL } from '../app/constants/auth-constants';
import { Environment } from '../app/types/environments.types';

export const environment: Environment = {
  production: false,
  apiUrl: DEV_BE_API_URL,
  feAppUrl: DEV_FE_URL
};

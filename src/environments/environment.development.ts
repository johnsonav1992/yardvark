import { DEV_BE_API_URL } from '../app/constants/api-constants';
import { Environment } from '../app/types/environments.types';

export const environment: Environment = {
  production: false,
  apiUrl: DEV_BE_API_URL
};

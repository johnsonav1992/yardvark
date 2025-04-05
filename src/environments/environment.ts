import { PROD_BE_API_URL } from '../app/constants/api-constants';
import { PROD_FE_URL } from '../app/constants/auth-constants';
import { Environment } from '../app/types/environments.types';

export const environment: Environment = {
  production: true,
  apiUrl: PROD_BE_API_URL,
  feAppUrl: PROD_FE_URL
};

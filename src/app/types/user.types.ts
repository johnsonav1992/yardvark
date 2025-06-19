import { User } from '@auth0/auth0-angular';
import { ROLES_CLAIM, USER_SIGNUP_CLAIM } from '../constants/auth-constants';

export type YVUser = User & {
  [ROLES_CLAIM]: string[];
  [USER_SIGNUP_CLAIM]: string;
};

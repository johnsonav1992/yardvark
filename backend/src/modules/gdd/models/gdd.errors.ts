import { ResourceValidationError } from '../../../errors/resource-error';

export class UserSettingsNotFound extends ResourceValidationError {
  constructor() {
    super({
      message: 'User settings not found',
      code: 'USER_SETTINGS_NOT_FOUND',
    });
  }
}

export class UserLocationNotConfigured extends ResourceValidationError {
  constructor() {
    super({
      message: 'User location not configured',
      code: 'USER_LOCATION_NOT_CONFIGURED',
    });
  }
}

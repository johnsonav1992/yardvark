import { ExternalServiceError } from '../../../errors/resource-error';

export class Auth0TokenError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to get Auth0 management token',
      code: 'AUTH0_TOKEN_ERROR',
      error: originalError,
    });
  }
}

export class UserUpdateError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to update user',
      code: 'USER_UPDATE_ERROR',
      error: originalError,
    });
  }
}

export class ProfilePictureUploadError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to upload profile picture',
      code: 'PROFILE_PICTURE_UPLOAD_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

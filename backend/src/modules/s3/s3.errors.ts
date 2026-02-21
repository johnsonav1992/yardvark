import { ExternalServiceError } from '../../errors/resource-error';

export class S3UploadError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to upload file to S3',
      code: 'S3_UPLOAD_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export class HeicConversionError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to convert HEIC file',
      code: 'HEIC_CONVERSION_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

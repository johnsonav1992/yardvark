import { ExternalServiceError } from '../../../errors/resource-error';

export class FileDownloadError extends ExternalServiceError {
  constructor(originalError?: Error | unknown) {
    super({
      message: 'Failed to download file',
      code: 'FILE_DOWNLOAD_ERROR',
      statusCode: 500,
      error: originalError,
    });
  }
}

export interface ResourceErrorParams {
  message: string;
  code: string;
  statusCode?: number;
  error?: Error | unknown;
}

export class ResourceError {
  message: string;
  code: string;
  statusCode: number;
  error?: Error | unknown;

  constructor({ message, code, statusCode, error }: ResourceErrorParams) {
    this.message = message;
    this.code = code;
    this.statusCode = statusCode || 500;
    this.error = error;
  }
}

export class ResourceNotFound extends ResourceError {
  constructor(params: Omit<ResourceErrorParams, 'statusCode'>) {
    super({ ...params, statusCode: 404 });
  }
}

export class ExternalServiceError extends ResourceError {
  constructor(
    params: Omit<ResourceErrorParams, 'statusCode'> & { statusCode?: number },
  ) {
    super({ ...params, statusCode: params.statusCode || 502 });
  }
}

export class ResourceValidationError extends ResourceError {
  constructor(params: Omit<ResourceErrorParams, 'statusCode'>) {
    super({ ...params, statusCode: 400 });
  }
}

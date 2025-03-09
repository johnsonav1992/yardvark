import { HttpClient } from '@angular/common/http';
import {
  ApplicationRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext
} from '@angular/core';
import { ApiEndpointRoutes } from '../types/endpoints.types';
import { BE_URL } from '../constants/api-constants';

let environmentInjector: EnvironmentInjector | null = null;

/**
 * Initializes the HTTP utilities by injecting the necessary dependencies.
 *
 * @param appRef - The reference to the application, used to access the injector.
 */
export const initHttpUtils = (appRef: ApplicationRef) => {
  environmentInjector = appRef.injector.get(EnvironmentInjector);
};

const createHttpUtil = <T, TArgs extends unknown[]>(
  utilFn: (http: HttpClient, ...args: TArgs) => T
) => {
  return (...args: TArgs): T => {
    if (!environmentInjector) {
      throw new Error(
        'HttpUtils have not been initialized. Call initHttpUtils() first.'
      );
    }

    const injector = environmentInjector;
    return runInInjectionContext(injector, () => {
      const http = injector.get(HttpClient);
      return utilFn(http, ...args);
    });
  };
};

export const postReq = createHttpUtil(
  <T>(http: HttpClient, ...postArgs: Parameters<HttpClient['post']>) => {
    return http.post<T>(...postArgs);
  }
);

export const getReq = createHttpUtil(
  <T>(http: HttpClient, ...getArgs: Parameters<HttpClient['get']>) => {
    return http.get<T>(...getArgs);
  }
);

export const putReq = createHttpUtil(
  <T>(http: HttpClient, ...putArgs: Parameters<HttpClient['put']>) => {
    return http.put<T>(...putArgs);
  }
);

export const deleteReq = createHttpUtil(
  <T>(http: HttpClient, ...deleteArgs: Parameters<HttpClient['delete']>) => {
    return http.delete<T>(...deleteArgs);
  }
);

/**
 * Constructs a full backend URL by appending the given endpoint path to the base URL.
 *
 * @param path - The endpoint path to be appended to the base URL.
 * @param opts - Optional parameters and query parameters to be included in the URL.
 * @returns The full URL as a string.
 */
export const apiUrl = (
  path: ApiEndpointRoutes,
  opts?: {
    params?: Array<string | number>;
    queryParams?: Record<string, unknown>;
  }
) => {
  let url = `${BE_URL}/${path}`;

  if (opts?.params) {
    url += '/' + opts.params.join('/');
  }

  if (opts?.queryParams) {
    const queryParams = new URLSearchParams(
      opts.queryParams as Record<string, string>
    ).toString();
    url += `?${queryParams}`;
  }

  return url;
};

/**
 * A quicker way to get the http client in a component or service
 */
export const injectHttp = () => inject(HttpClient);

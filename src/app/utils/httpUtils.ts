import { HttpClient } from '@angular/common/http';
import {
  ApplicationRef,
  EnvironmentInjector,
  runInInjectionContext
} from '@angular/core';
import { EndPoints } from '../types/endpoints.types';
import { BE_URL } from '../constants/api-constants';

let environmentInjector: EnvironmentInjector | null = null;

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

export const beUrl = (path: EndPoints) => `${BE_URL}/${path}`;

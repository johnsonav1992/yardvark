import { Injectable } from '@angular/core';
import { apiUrl, getReq, postReq } from '../utils/httpUtils';
import { from, map, mergeMap, Observable, scan, tap } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  public uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('file', file));

    return postReq<string[]>(apiUrl('files/upload'), formData);
  }

  public downloadFiles(fileUrls: string[]): Observable<File[]> {
    return from(fileUrls).pipe(
      mergeMap((url) =>
        getReq<HttpResponse<Blob>>(
          apiUrl('files/download', {
            queryParams: { url }
          }),
          {
            responseType: 'blob',
            observe: 'response'
          } as never
        ).pipe(
          map((response) => {
            const filename = url.split('-').pop() || 'downloaded-file';

            return new File([response.body!], filename, {
              type: response.body!.type
            });
          })
        )
      ),
      scan<File, File[]>((files, file) => [...files, file], [])
    );
  }
}

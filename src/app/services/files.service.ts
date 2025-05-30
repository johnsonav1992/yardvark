import { Injectable } from '@angular/core';
import { postReq } from '../utils/httpUtils';

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  public uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('file', file));

    return postReq<string[]>(`files/upload`, formData);
  }
}

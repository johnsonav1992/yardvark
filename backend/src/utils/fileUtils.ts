import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { MAX_FILE_UPLOAD_SIZE } from './constants';

export const imageFileValidator = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: MAX_FILE_UPLOAD_SIZE }),
    new FileTypeValidator({ fileType: 'image' }),
  ],
  fileIsRequired: false,
});

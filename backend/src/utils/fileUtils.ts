import {
	FileTypeValidator,
	MaxFileSizeValidator,
	ParseFilePipe,
} from "@nestjs/common";
import { MAX_FILE_UPLOAD_SIZE } from "./constants";

export const imageFileValidator = (maxFileSizeMB = MAX_FILE_UPLOAD_SIZE) =>
	new ParseFilePipe({
		validators: [
			new MaxFileSizeValidator({ maxSize: maxFileSizeMB }),
			new FileTypeValidator({ fileType: "image" }),
		],
		fileIsRequired: false,
	});

import {
	BadRequestException,
	FileTypeValidator,
	MaxFileSizeValidator,
	ParseFilePipe,
} from "@nestjs/common";
import { ALLOWED_IMAGE_SIGNATURES, MAX_FILE_UPLOAD_SIZE } from "./constants";

export const validateImageMagicBytes = (file: Express.Multer.File): void => {
	const buf = file.buffer;

	const isValid = ALLOWED_IMAGE_SIGNATURES.some(({ bytes }) =>
		bytes.every((byte, i) => buf[i] === byte),
	);

	if (!isValid) {
		throw new BadRequestException("Invalid image file");
	}

	if (
		file.mimetype === "image/webp" &&
		!(
			buf[8] === 0x57 &&
			buf[9] === 0x45 &&
			buf[10] === 0x42 &&
			buf[11] === 0x50
		)
	) {
		throw new BadRequestException("Invalid image file");
	}
};

export const imageFileValidator = (maxFileSizeMB = MAX_FILE_UPLOAD_SIZE) =>
	new ParseFilePipe({
		validators: [
			new MaxFileSizeValidator({ maxSize: maxFileSizeMB }),
			new FileTypeValidator({ fileType: "image" }),
		],
		fileIsRequired: false,
	});

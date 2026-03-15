export const MAX_FILE_UPLOAD_SIZE = 2_000_000; // 2MB
export const MAX_FILE_LARGE_UPLOAD_SIZE = 10_000_000; // 10MB

export const ALLOWED_IMAGE_SIGNATURES: { mime: string; bytes: number[] }[] = [
	{ mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
	{
		mime: "image/png",
		bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
	},
	{ mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
	{ mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

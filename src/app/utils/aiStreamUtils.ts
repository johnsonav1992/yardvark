interface ParsedSseChunk {
	dataLines: string[];
	remainder: string;
}

const parseSseChunk = (buffer: string): ParsedSseChunk => {
	const lines = buffer.split("\n");

	return {
		dataLines: lines
			.slice(0, -1)
			.filter((line) => line.startsWith("data: "))
			.map((line) => line.slice(6).trim())
			.filter(Boolean),
		remainder: lines.at(-1) ?? "",
	};
};

export async function* streamSseDataLines(
	stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			buffer += decoder.decode(value, { stream: true });
			const { dataLines, remainder } = parseSseChunk(buffer);
			buffer = remainder;

			for (const dataLine of dataLines) {
				yield dataLine;
			}
		}
	} finally {
		reader.releaseLock();
	}
}

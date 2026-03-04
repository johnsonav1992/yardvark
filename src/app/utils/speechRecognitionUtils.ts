export type SpeechRecognitionCtor = new () => SpeechRecognition;

export const getSpeechRecognitionCtor = (): SpeechRecognitionCtor | null => {
	if (typeof window === "undefined") {
		return null;
	}

	return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const buildTranscriptFromSpeechResults = (
	event: SpeechRecognitionEvent,
): string => {
	const results = event.results;

	if (!results) {
		return "";
	}

	let transcript = "";

	for (let i = event.resultIndex; i < results.length; i += 1) {
		const segment = results[i]?.[0]?.transcript;

		if (segment) {
			transcript += segment;
		}
	}

	return transcript.trim();
};

export const isSpeechPermissionDeniedError = (
	error: SpeechRecognitionErrorEvent["error"],
): boolean => error === "not-allowed" || error === "service-not-allowed";

export const shouldIgnoreSpeechError = (
	error: SpeechRecognitionErrorEvent["error"],
): boolean => error === "no-speech" || error === "aborted";

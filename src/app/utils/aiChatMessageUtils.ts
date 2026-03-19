import { AI_CHAT_FALLBACK_ERROR_MESSAGE } from "../constants/ai-constants";
import type {
	AiChatMessageDraftStatus,
	AiEntryDraftData,
} from "../types/ai.types";
import type { AiChatMessage } from "./aiChatUtils";

const RAW_ERROR_PAYLOAD_MARKERS = [
	"error.stack",
	"error.code",
	"HttpException:",
	"node:internal/process/task_queues",
	"database.numCalls",
	"HISTORICAL_WEATHER_FETCH_ERROR",
];

const isLikelyRawErrorPayload = (text: string): boolean => {
	const trimmed = text.trim();
	const hasObjectLikeShape =
		(trimmed.startsWith("{") && trimmed.endsWith("}")) ||
		(trimmed.startsWith("[") && trimmed.endsWith("]"));

	if (!hasObjectLikeShape) {
		return false;
	}

	if (RAW_ERROR_PAYLOAD_MARKERS.some((marker) => trimmed.includes(marker))) {
		return true;
	}

	try {
		const parsed: unknown = JSON.parse(trimmed);

		return typeof parsed === "object" && parsed !== null && "error" in parsed;
	} catch {
		return false;
	}
};

const sanitizeAiMessageContent = (text: string): string =>
	isLikelyRawErrorPayload(text) ? AI_CHAT_FALLBACK_ERROR_MESSAGE : text;

export const addUserChatMessage = (
	messages: AiChatMessage[],
	query: string,
): AiChatMessage[] => [...messages, { role: "user", content: query }];

export const addPendingAiChatMessage = (
	messages: AiChatMessage[],
): AiChatMessage[] => [...messages, { role: "ai", content: "" }];

export const appendToLastAiChatMessage = (
	messages: AiChatMessage[],
	chunkText: string,
): AiChatMessage[] => {
	const last = messages[messages.length - 1];

	if (!last) {
		return messages;
	}

	const nextContent = sanitizeAiMessageContent(last.content + chunkText);

	return [...messages.slice(0, -1), { ...last, content: nextContent }];
};

export const applyAiChatErrorToLastMessage = (
	messages: AiChatMessage[],
	errorMessage = AI_CHAT_FALLBACK_ERROR_MESSAGE,
): AiChatMessage[] => {
	const last = messages[messages.length - 1];

	if (!last) {
		return messages;
	}

	const sanitizedErrorMessage = sanitizeAiMessageContent(errorMessage);

	return [
		...messages.slice(0, -1),
		{ ...last, content: last.content || sanitizedErrorMessage },
	];
};

export const attachDraftToLastAiMessage = (
	messages: AiChatMessage[],
	draft: AiEntryDraftData,
): AiChatMessage[] => {
	const last = messages[messages.length - 1];

	if (!last || last.role !== "ai") {
		return messages;
	}

	return [
		...messages.slice(0, -1),
		{
			...last,
			entryDraft: draft,
			draftStatus: "pending" as AiChatMessageDraftStatus,
		},
	];
};

export const updateMessageDraftStatus = (
	messages: AiChatMessage[],
	index: number,
	status: AiChatMessageDraftStatus,
): AiChatMessage[] =>
	messages.map((msg, i) =>
		i === index ? { ...msg, draftStatus: status } : msg,
	);

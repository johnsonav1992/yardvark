import { AI_CHAT_FALLBACK_ERROR_MESSAGE } from "../constants/ai-constants";
import type { AiChatMessage } from "./aiChatUtils";

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

	return [
		...messages.slice(0, -1),
		{ ...last, content: last.content + chunkText },
	];
};

export const applyAiChatErrorToLastMessage = (
	messages: AiChatMessage[],
	errorMessage = AI_CHAT_FALLBACK_ERROR_MESSAGE,
): AiChatMessage[] => {
	const last = messages[messages.length - 1];

	if (!last) {
		return messages;
	}

	return [
		...messages.slice(0, -1),
		{ ...last, content: last.content || errorMessage },
	];
};

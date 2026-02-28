import { AI_CHAT_FALLBACK_ERROR_MESSAGE } from "../constants/ai-constants";
import type { AiEntryDraftData, AiChatMessageDraftStatus } from "../types/ai.types";
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
		{ ...last, entryDraft: draft, draftStatus: "pending" as AiChatMessageDraftStatus },
	];
};

export const updateMessageDraftStatus = (
	messages: AiChatMessage[],
	index: number,
	status: AiChatMessageDraftStatus,
): AiChatMessage[] =>
	messages.map((msg, i) => (i === index ? { ...msg, draftStatus: status } : msg));

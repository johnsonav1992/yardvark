import type { Signal } from "@angular/core";
import { DestroyRef, inject, signal } from "@angular/core";
import { AiService } from "../services/ai.service";
import type { AiEntryQueryLimitStatus, AiStreamEvent } from "../types/ai.types";
import {
	addPendingAiChatMessage,
	addUserChatMessage,
	appendToLastAiChatMessage,
	applyAiChatErrorToLastMessage,
} from "./aiChatMessageUtils";

export interface AiChatMessage {
	role: "user" | "ai";
	content: string;
}

interface AiChatHook {
	messages: Signal<AiChatMessage[]>;
	isStreaming: Signal<boolean>;
	statusMessage: Signal<string | null>;
	limitStatus: Signal<AiEntryQueryLimitStatus | null>;
	send: (query: string) => Promise<void>;
	abort: () => void;
	refreshLimitStatus: () => Promise<void>;
}

export type AiStreamFn = (
	query: string,
	signal: AbortSignal,
) => AsyncGenerator<AiStreamEvent>;

export function injectAiChat(streamFn?: AiStreamFn): AiChatHook {
	const aiService = inject(AiService);
	const destroyRef = inject(DestroyRef);

	const resolvedStreamFn =
		streamFn ?? aiService.streamQueryEntries.bind(aiService);

	const messages = signal<AiChatMessage[]>([]);
	const isStreaming = signal(false);
	const statusMessage = signal<string | null>(null);
	const limitStatus = signal<AiEntryQueryLimitStatus | null>(null);

	let abortController: AbortController | null = null;

	destroyRef.onDestroy(() => abortController?.abort());

	const send = async (query: string): Promise<void> => {
		if (
			!query.trim() ||
			isStreaming() ||
			(limitStatus()?.remaining ?? 1) <= 0
		) {
			return;
		}

		messages.update((msgs) => addUserChatMessage(msgs, query));
		isStreaming.set(true);
		statusMessage.set(null);
		messages.update(addPendingAiChatMessage);

		abortController = new AbortController();

		try {
			for await (const event of resolvedStreamFn(
				query,
				abortController.signal,
			)) {
				if (event.type === "status") {
					statusMessage.set(event.message);
				} else if (event.type === "limit") {
					limitStatus.set(event.data);
				} else if (event.type === "chunk") {
					statusMessage.set(null);
					messages.update((msgs) =>
						appendToLastAiChatMessage(msgs, event.text),
					);
				} else if (event.type === "error") {
					messages.update((msgs) =>
						applyAiChatErrorToLastMessage(msgs, event.message),
					);
				}
			}
		} finally {
			isStreaming.set(false);
			statusMessage.set(null);
			abortController = null;
		}
	};

	const abort = (): void => {
		abortController?.abort();
		abortController = null;
		isStreaming.set(false);
		statusMessage.set(null);
	};

	const refreshLimitStatus = async (): Promise<void> => {
		const status = await aiService.getQueryEntriesLimitStatusAsync();
		limitStatus.set(status);
	};

	return {
		messages,
		isStreaming,
		statusMessage,
		limitStatus,
		send,
		abort,
		refreshLimitStatus,
	};
}

import type { Signal } from "@angular/core";
import { DestroyRef, inject, signal } from "@angular/core";
import { AiService } from "../services/ai.service";
import type { AiStreamEvent } from "../types/ai.types";

export interface AiChatMessage {
	role: "user" | "ai";
	content: string;
}

interface AiChatHook {
	messages: Signal<AiChatMessage[]>;
	isStreaming: Signal<boolean>;
	statusMessage: Signal<string | null>;
	send: (query: string) => Promise<void>;
	abort: () => void;
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

	let abortController: AbortController | null = null;

	destroyRef.onDestroy(() => abortController?.abort());

	const send = async (query: string): Promise<void> => {
		if (!query.trim() || isStreaming()) {
			return;
		}

		messages.update((msgs) => [...msgs, { role: "user", content: query }]);
		isStreaming.set(true);
		statusMessage.set(null);
		messages.update((msgs) => [...msgs, { role: "ai", content: "" }]);

		abortController = new AbortController();

		try {
			for await (const event of resolvedStreamFn(
				query,
				abortController.signal,
			)) {
				if (event.type === "status") {
					statusMessage.set(event.message);
				} else if (event.type === "chunk") {
					statusMessage.set(null);
					messages.update((msgs) => {
						const last = msgs[msgs.length - 1];

						return [
							...msgs.slice(0, -1),
							{ ...last, content: last.content + event.text },
						];
					});
				} else if (event.type === "error") {
					messages.update((msgs) => {
						const last = msgs[msgs.length - 1];

						return [
							...msgs.slice(0, -1),
							{
								...last,
								content:
									last.content ||
									"Sorry, something went wrong. Please try again.",
							},
						];
					});
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

	return { messages, isStreaming, statusMessage, send, abort };
}

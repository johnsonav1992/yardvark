import type { Signal } from "@angular/core";
import { computed, DestroyRef, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AiService } from "../services/ai.service";
import { EntriesService } from "../services/entries.service";
import type {
	AiChatMessageDraftStatus,
	AiEntryDraftData,
	AiEntryQueryLimitStatus,
	AiStreamEvent,
} from "../types/ai.types";
import type { EntryCreationRequestFormInput } from "../types/entries.types";
import type { YVUser } from "../types/user.types";
import type { Maybe } from "../types/utils.types";
import {
	addPendingAiChatMessage,
	addUserChatMessage,
	appendToLastAiChatMessage,
	applyAiChatErrorToLastMessage,
	attachDraftToLastAiMessage,
	updateMessageDraftStatus,
} from "./aiChatMessageUtils";
import { injectUserData, isMasterUser } from "./authUtils";
import { parseYyyyMmDdToLocalNoon } from "./timeUtils";

export interface AiChatMessage {
	role: "user" | "ai";
	content: string;
	entryDraft?: AiEntryDraftData;
	draftStatus?: AiChatMessageDraftStatus;
}

interface AiChatHook {
	messages: Signal<AiChatMessage[]>;
	isStreaming: Signal<boolean>;
	statusMessage: Signal<string | null>;
	limitStatus: Signal<AiEntryQueryLimitStatus | null>;
	send: (query: string) => Promise<void>;
	abort: () => void;
	clearChat: () => void;
	refreshLimitStatus: () => Promise<void>;
	confirmEntryDraft: (messageIndex: number) => Promise<void>;
	rejectEntryDraft: (messageIndex: number) => void;
}

export type AiStreamFn = (
	query: string,
	signal: AbortSignal,
) => AsyncGenerator<AiStreamEvent>;

export function injectAiChat(
	streamFn?: AiStreamFn,
	onEntryCreated?: () => void,
): AiChatHook {
	const aiService = inject(AiService);
	const entriesService = inject(EntriesService);
	const destroyRef = inject(DestroyRef);
	const userData = injectUserData();
	let sessionId = crypto.randomUUID();

	const resolvedStreamFn =
		streamFn ??
		((q: string, signal: AbortSignal) =>
			aiService.streamQueryEntries(q, sessionId, signal));

	const messages = signal<AiChatMessage[]>([]);
	const isStreaming = signal(false);
	const statusMessage = signal<string | null>(null);
	const limitStatus = signal<AiEntryQueryLimitStatus | null>(null);
	const isMaster = computed(() => isMasterUser(userData() as Maybe<YVUser>));

	let abortController: AbortController | null = null;

	destroyRef.onDestroy(() => abortController?.abort());

	const send = async (query: string): Promise<void> => {
		if (
			!query.trim() ||
			isStreaming() ||
			(!isMaster() && (limitStatus()?.remaining ?? 1) <= 0)
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
				} else if (event.type === "entry_draft") {
					messages.update((msgs) =>
						attachDraftToLastAiMessage(msgs, event.data),
					);
				} else if (event.type === "error") {
					messages.update((msgs) =>
						applyAiChatErrorToLastMessage(msgs, event.message),
					);
				}
			}
		} finally {
			const lastMsg = messages()[messages().length - 1];

			if (lastMsg?.role === "ai" && !lastMsg.content && lastMsg.entryDraft) {
				messages.update((msgs) => {
					const updated = [...msgs];
					updated[updated.length - 1] = {
						...updated[updated.length - 1],
						content:
							"Here's a draft entry for your review. Confirm it or let me know if anything needs to change.",
					};

					return updated;
				});
			}

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

	const clearChat = (): void => {
		abort();
		messages.set([]);
		sessionId = crypto.randomUUID();
	};

	const refreshLimitStatus = async (): Promise<void> => {
		const status = await aiService.getQueryEntriesLimitStatusAsync();
		limitStatus.set(status);
	};

	const confirmEntryDraft = async (messageIndex: number): Promise<void> => {
		const msg = messages()[messageIndex];

		if (!msg?.entryDraft || msg.draftStatus !== "pending") {
			return;
		}

		messages.update((msgs) =>
			updateMessageDraftStatus(msgs, messageIndex, "confirming"),
		);

		const draft = msg.entryDraft;
		const request: EntryCreationRequestFormInput = {
			date: parseYyyyMmDdToLocalNoon(draft.date),
			time: draft.time ?? null,
			title: draft.title ?? "",
			notes: draft.notes,
			soilTemperature: draft.soilTemperature ?? null,
			soilTemperatureUnit: draft.soilTemperatureUnit ?? "F",
			mowingHeight: draft.mowingHeight ?? null,
			mowingHeightUnit: draft.mowingHeightUnit ?? "in",
			activityIds: draft.activityIds,
			lawnSegmentIds: draft.lawnSegmentIds,
			products: draft.products.map((p) => ({
				productId: p.productId,
				productQuantity: p.productQuantity,
				productQuantityUnit: p.productQuantityUnit,
			})),
			images: [],
		};

		try {
			await firstValueFrom(entriesService.addEntry(request));
			messages.update((msgs) =>
				updateMessageDraftStatus(msgs, messageIndex, "confirmed"),
			);
			onEntryCreated?.();
		} catch {
			messages.update((msgs) =>
				updateMessageDraftStatus(msgs, messageIndex, "error"),
			);
		}
	};

	const rejectEntryDraft = (messageIndex: number): void => {
		messages.update((msgs) =>
			updateMessageDraftStatus(msgs, messageIndex, "rejected"),
		);
	};

	return {
		messages,
		isStreaming,
		statusMessage,
		limitStatus,
		send,
		abort,
		clearChat,
		refreshLimitStatus,
		confirmEntryDraft,
		rejectEntryDraft,
	};
}

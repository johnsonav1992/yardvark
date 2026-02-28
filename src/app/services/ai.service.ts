import { Injectable, inject } from "@angular/core";
import { AuthService } from "@auth0/auth0-angular";
import {
	catchError,
	firstValueFrom,
	from,
	map,
	type Observable,
	of,
	timeout,
} from "rxjs";
import type {
	AiChatResponse,
	AiEntryQueryLimitStatus,
	AiStreamEvent,
} from "../types/ai.types";
import { streamSseDataLines } from "../utils/aiStreamUtils";
import { apiUrl, postReq } from "../utils/httpUtils";

@Injectable({
	providedIn: "root",
})
export class AiService {
	private readonly _auth = inject(AuthService);

	public sendChatMessage(prompt: string): Observable<AiChatResponse | null> {
		return postReq<AiChatResponse>(apiUrl("ai/chat"), { prompt }).pipe(
			timeout(15000),
			catchError(() => of(null)),
		);
	}

	public sendChatMessageContent(prompt: string): Observable<string> {
		return postReq<AiChatResponse>(apiUrl("ai/chat"), { prompt }).pipe(
			timeout(15000),
			catchError(() => of(null)),
			map((response: AiChatResponse | null) => response?.content || ""),
		);
	}

	public getQueryEntriesLimitStatus(): Observable<AiEntryQueryLimitStatus | null> {
		return from(this.getQueryEntriesLimitStatusAsync()).pipe(
			catchError(() => of(null)),
		);
	}

	public async getQueryEntriesLimitStatusAsync(): Promise<AiEntryQueryLimitStatus | null> {
		let token: string;

		try {
			token = await firstValueFrom(this._auth.getAccessTokenSilently());
		} catch {
			return null;
		}

		const url = apiUrl("ai/query-entries/limit");

		try {
			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				return null;
			}

			return (await response.json()) as AiEntryQueryLimitStatus;
		} catch {
			return null;
		}
	}

	public async *streamQueryEntries(
		query: string,
		sessionId: string,
		signal?: AbortSignal,
	): AsyncGenerator<AiStreamEvent> {
		let token: string;

		try {
			token = await firstValueFrom(this._auth.getAccessTokenSilently());
		} catch {
			yield { type: "error", message: "Authentication failed" };
			return;
		}

		const url = apiUrl("ai/query-entries/stream");
		let response: Response;

		try {
			response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ query, sessionId }),
				signal,
			});
		} catch (err) {
			if (err instanceof Error && err.name !== "AbortError") {
				yield { type: "error", message: "Failed to connect to AI service" };
			}

			return;
		}

		if (!response.ok || !response.body) {
			let message = "AI service returned an error";

			try {
				const errorBody = (await response.json()) as {
					message?: string;
					code?: string;
				};
				message = errorBody.message || message;
			} catch {
				// no-op
			}

			yield { type: "error", message };
			return;
		}

		try {
			for await (const dataLine of streamSseDataLines(response.body)) {
				try {
					yield JSON.parse(dataLine) as AiStreamEvent;
				} catch {
					// ignore malformed events
				}
			}
		} catch (err) {
			if (err instanceof Error && err.name !== "AbortError") {
				yield { type: "error", message: "Stream interrupted" };
			}
		}
	}
}

import { inject, Injectable } from "@angular/core";
import { AuthService } from "@auth0/auth0-angular";
import { catchError, firstValueFrom, map, type Observable, of, timeout } from "rxjs";
import type { AiChatResponse, AiStreamEvent } from "../types/ai.types";
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

	public async *streamQueryEntries(
		query: string,
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
				body: JSON.stringify({ query }),
				signal,
			});
		} catch (err) {
			if (err instanceof Error && err.name !== "AbortError") {
				yield { type: "error", message: "Failed to connect to AI service" };
			}

			return;
		}

		if (!response.ok || !response.body) {
			yield { type: "error", message: "AI service returned an error" };
			return;
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		try {
			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const data = line.slice(6).trim();

						if (data) {
							try {
								yield JSON.parse(data) as AiStreamEvent;
							} catch {
								// ignore malformed events
							}
						}
					}
				}
			}
		} catch (err) {
			if (err instanceof Error && err.name !== "AbortError") {
				yield { type: "error", message: "Stream interrupted" };
			}
		} finally {
			reader.releaseLock();
		}
	}
}

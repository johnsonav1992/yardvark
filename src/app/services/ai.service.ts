import { Injectable } from "@angular/core";
import { catchError, map, type Observable, of, timeout } from "rxjs";
import type { AiChatResponse } from "../types/ai.types";
import { apiUrl, postReq } from "../utils/httpUtils";

@Injectable({
	providedIn: "root",
})
export class AiService {
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
}

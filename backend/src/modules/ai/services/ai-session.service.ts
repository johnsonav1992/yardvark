import { Injectable } from "@nestjs/common";
import type { Content } from "@google/genai";

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_HISTORY_TURNS = 20;

interface ChatSession {
	history: Content[];
	lastAccessed: number;
}

@Injectable()
export class AiSessionService {
	private readonly sessions = new Map<string, ChatSession>();

	public getHistory(sessionId: string): Content[] {
		const session = this.sessions.get(sessionId);

		if (!session) {
			return [];
		}

		session.lastAccessed = Date.now();

		return session.history;
	}

	public appendTurn(
		sessionId: string,
		userContent: Content,
		modelContent: Content,
	): void {
		const existing = this.sessions.get(sessionId);
		const history = existing?.history ?? [];
		const trimmed = history.slice(-(MAX_HISTORY_TURNS - 1) * 2);

		this.sessions.set(sessionId, {
			history: [...trimmed, userContent, modelContent],
			lastAccessed: Date.now(),
		});

		this.cleanupExpired();
	}

	private cleanupExpired(): void {
		const now = Date.now();

		for (const [id, session] of this.sessions.entries()) {
			if (now - session.lastAccessed > SESSION_TTL_MS) {
				this.sessions.delete(id);
			}
		}
	}
}

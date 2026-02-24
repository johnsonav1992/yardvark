import type { ElementRef } from "@angular/core";
import {
	Component,
	DestroyRef,
	effect,
	inject,
	model,
	signal,
	viewChild,
} from "@angular/core";
import { ButtonModule } from "primeng/button";
import { DrawerModule } from "primeng/drawer";
import { InputTextModule } from "primeng/inputtext";
import { AiService } from "../../../services/ai.service";
import { GlobalUiService } from "../../../services/global-ui.service";

interface ChatMessage {
	role: "user" | "ai";
	content: string;
}

@Component({
	selector: "entry-ai-chat",
	imports: [DrawerModule, ButtonModule, InputTextModule],
	templateUrl: "./entry-ai-chat.component.html",
	styleUrl: "./entry-ai-chat.component.scss",
})
export class EntryAiChatComponent {
	private readonly _aiService = inject(AiService);
	private readonly _globalUiService = inject(GlobalUiService);
	private readonly _destroyRef = inject(DestroyRef);
	private readonly _messagesEnd = viewChild<ElementRef<HTMLDivElement>>("messagesEnd");
	private _abortController: AbortController | null = null;

	public isOpen = model(false);
	public isMobile = this._globalUiService.isMobile;
	public messages = signal<ChatMessage[]>([]);
	public currentInput = signal("");
	public isStreaming = signal(false);
	public statusMessage = signal<string | null>(null);

	public readonly suggestions = [
		"When did I last mow?",
		"What products did I use this year?",
		"How many times did I fertilize last year?",
		"What activities did I do last month?",
	];

	constructor() {
		this._destroyRef.onDestroy(() => this._abortController?.abort());

		effect(() => {
			this.messages();
			this.statusMessage();

			setTimeout(() => {
				this._messagesEnd()?.nativeElement?.scrollIntoView({ behavior: "smooth" });
			}, 0);
		});
	}

	public onClose(): void {
		this._abortController?.abort();
		this._abortController = null;
		this.isStreaming.set(false);
		this.statusMessage.set(null);
	}

	public onQueryInput(event: Event): void {
		this.currentInput.set((event.target as HTMLInputElement).value);
	}

	public async send(): Promise<void> {
		const query = this.currentInput().trim();

		if (!query || this.isStreaming()) {
			return;
		}

		this.messages.update((msgs) => [...msgs, { role: "user", content: query }]);
		this.currentInput.set("");
		this.isStreaming.set(true);
		this.statusMessage.set(null);
		this.messages.update((msgs) => [...msgs, { role: "ai", content: "" }]);

		this._abortController = new AbortController();

		try {
			for await (const event of this._aiService.streamQueryEntries(
				query,
				this._abortController.signal,
			)) {
				if (event.type === "status") {
					this.statusMessage.set(event.message);
				} else if (event.type === "chunk") {
					this.statusMessage.set(null);
					this.messages.update((msgs) => {
						const last = msgs[msgs.length - 1];

						return [
							...msgs.slice(0, -1),
							{ ...last, content: last.content + event.text },
						];
					});
				} else if (event.type === "error") {
					this.messages.update((msgs) => {
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
			this.isStreaming.set(false);
			this.statusMessage.set(null);
			this._abortController = null;
		}
	}

	public async sendSuggestion(text: string): Promise<void> {
		this.currentInput.set(text);
		await this.send();
	}
}

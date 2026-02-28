import type { ElementRef } from "@angular/core";
import {
	Component,
	computed,
	effect,
	inject,
	model,
	signal,
	viewChild,
} from "@angular/core";
import { format } from "date-fns";
import { ButtonModule } from "primeng/button";
import { DrawerModule } from "primeng/drawer";
import { InputTextModule } from "primeng/inputtext";
import { ENTRY_AI_CHAT_SUGGESTIONS } from "../../../constants/ai-constants";
import { GlobalUiService } from "../../../services/global-ui.service";
import { injectAiChat } from "../../../utils/aiChatUtils";

@Component({
	selector: "entry-ai-chat",
	imports: [DrawerModule, ButtonModule, InputTextModule],
	templateUrl: "./entry-ai-chat.component.html",
	styleUrl: "./entry-ai-chat.component.scss",
})
export class EntryAiChatComponent {
	private readonly _globalUiService = inject(GlobalUiService);
	private readonly _messagesEnd =
		viewChild<ElementRef<HTMLDivElement>>("messagesEnd");
	private readonly _chat = injectAiChat();

	public isOpen = model(false);
	public isMobile = this._globalUiService.isMobile;
	public currentInput = signal("");
	public readonly messages = this._chat.messages;
	public readonly isStreaming = this._chat.isStreaming;
	public readonly statusMessage = this._chat.statusMessage;
	public readonly limitStatus = this._chat.limitStatus;
	public readonly isLimitReached = computed(
		() => (this.limitStatus()?.remaining ?? 1) <= 0,
	);
	public readonly isInputDisabled = computed(
		() => this.isStreaming() || this.isLimitReached(),
	);
	public readonly isSendDisabled = computed(
		() => !this.currentInput().trim() || this.isInputDisabled(),
	);
	public readonly limitResetHint = computed(() => {
		const resetAt = this.limitStatus()?.resetAt;

		if (!resetAt) {
			return "";
		}

		const resetDate = new Date(resetAt);

		if (Number.isNaN(resetDate.getTime())) {
			return "";
		}

		return `Resets at ${resetDate.toLocaleTimeString([], {
			hour: "numeric",
			minute: "2-digit",
		})}.`;
	});
	public readonly disabledReason = computed(() => {
		if (this.isStreaming()) {
			return "Varky is still responding. Please wait.";
		}

		if (this.isLimitReached()) {
			const resetHint = this.limitResetHint();
			return resetHint
				? `You've reached your daily message limit. ${resetHint}`
				: "You've reached your daily message limit.";
		}

		return null;
	});

	public readonly suggestions = ENTRY_AI_CHAT_SUGGESTIONS;

	constructor() {
		effect(() => {
			if (this.isOpen()) {
				void this._chat.refreshLimitStatus();
			}
		});

		effect(() => {
			this.messages();
			this.statusMessage();

			setTimeout(() => {
				this._messagesEnd()?.nativeElement?.scrollIntoView({
					behavior: "smooth",
				});
			}, 0);
		});
	}

	public onClose(): void {
		this._chat.abort();
	}

	public onQueryInput(event: Event): void {
		this.currentInput.set((event.target as HTMLInputElement).value);
	}

	public async send(): Promise<void> {
		const query = this.currentInput().trim();

		if (!query || this.isInputDisabled()) {
			return;
		}

		this.currentInput.set("");
		await this._chat.send(query);
	}

	public async sendSuggestion(text: string): Promise<void> {
		this.currentInput.set(text);
		await this.send();
	}

	public formatDraftDate(dateStr: string): string {
		return format(new Date(`${dateStr}T12:00:00`), "MMMM do, yyyy");
	}

	public async confirmDraft(messageIndex: number): Promise<void> {
		await this._chat.confirmEntryDraft(messageIndex);
	}

	public rejectDraft(messageIndex: number): void {
		this._chat.rejectEntryDraft(messageIndex);
	}
}

import type { ElementRef } from "@angular/core";
import {
	Component,
	effect,
	inject,
	model,
	signal,
	viewChild,
} from "@angular/core";
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

	public readonly suggestions = ENTRY_AI_CHAT_SUGGESTIONS;

	constructor() {
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

		if (!query) {
			return;
		}

		this.currentInput.set("");
		await this._chat.send(query);
	}

	public async sendSuggestion(text: string): Promise<void> {
		this.currentInput.set(text);
		await this.send();
	}
}

import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class AppErrorService {
	public readonly hasFatalError = signal(false);

	public setFatalError(): void {
		this.hasFatalError.set(true);
	}

	public clearError(): void {
		this.hasFatalError.set(false);
	}
}

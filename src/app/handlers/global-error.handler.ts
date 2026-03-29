import { HttpErrorResponse } from "@angular/common/http";
import { ErrorHandler, Injectable, Injector, inject } from "@angular/core";
import { environment } from "../../environments/environment";
import { AppErrorService } from "../services/app-error.service";

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
	private readonly _injector = inject(Injector);

	public handleError(error: unknown): void {
		console.error("[GlobalErrorHandler]", error);

		if (error instanceof HttpErrorResponse) {
			return;
		}

		if (environment.production) {
			import("logrocket").then(({ default: LogRocket }) => {
				const err = error instanceof Error ? error : new Error(String(error));

				LogRocket.captureException(err);
			});
		}

		this._injector.get(AppErrorService).setFatalError();
	}
}

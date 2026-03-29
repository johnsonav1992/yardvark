import { HttpErrorResponse, type HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { MessageService } from "primeng/api";
import { catchError, throwError } from "rxjs";

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
	const messageService = inject(MessageService);

	return next(req).pipe(
		catchError((error: unknown) => {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 0) {
					messageService.add({
						severity: "error",
						summary: "Connection Error",
						detail: "Unable to reach the server. Check your connection.",
						sticky: true,
					});
				} else if (error.status >= 500) {
					messageService.add({
						severity: "error",
						summary: "Server Error",
						detail: "Something went wrong on our end. Please try again.",
					});
				}
			}

			return throwError(() => error);
		}),
	);
};

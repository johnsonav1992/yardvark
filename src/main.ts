import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { environment } from "./environments/environment";

if (environment.production) {
	import("logrocket").then((LogRocket) => {
		LogRocket.default.init("yardvark/yardvark");
	});
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
	console.error(err),
);

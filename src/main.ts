import { bootstrapApplication } from "@angular/platform-browser";
import LogRocket from "logrocket";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { environment } from "./environments/environment";

if (environment.production) {
	LogRocket.init("yardvark/yardvark");
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
	console.error(err),
);

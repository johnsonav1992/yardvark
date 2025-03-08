import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initHttpUtils } from './app/utils/httpUtils';

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => initHttpUtils(appRef))
  .catch((err) => console.error(err));

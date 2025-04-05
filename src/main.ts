import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import LogRocket from 'logrocket';

LogRocket.init('yardvark/yardvark');

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);

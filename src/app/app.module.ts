import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';
import {QuizWindowComponent} from './components/quiz-window/quiz-window.component';
import {RoutingService} from "./services/routing.service";
import {HomeWindowComponent} from './components/home-window/home-window.component';
import {ReactiveFormsModule} from "@angular/forms";
import {LogInComponent} from './components/user/log-in/log-in.component';
import {SignUpComponent} from './components/user/sign-up/sign-up.component';

@NgModule({
  declarations: [
    AppComponent,
    QuizWindowComponent,
    HomeWindowComponent,
    LogInComponent,
    SignUpComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    RoutingService,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

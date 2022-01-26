import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {HomeWindowComponent} from "../components/home-window/home-window.component";
import {QuizWindowComponent} from "../components/quiz-window/quiz-window.component";
import {LogInComponent} from "../components/user/log-in/log-in.component";
import {SignUpComponent} from "../components/user/sign-up/sign-up.component";

const routes: Routes = [
  {path: '', component: HomeWindowComponent},
  {path: 'home', component: HomeWindowComponent},
  {path: 'quiz', component: QuizWindowComponent},
  {path: 'user/login', component: LogInComponent},
  {path: 'user/signup', component: SignUpComponent},
  {path: '**', redirectTo: 'home', component: HomeWindowComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingService {

  constructor() {
  }

}

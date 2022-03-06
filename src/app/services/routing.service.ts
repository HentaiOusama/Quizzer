import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {HomeWindowComponent} from "../components/home-window/home-window.component";
import {QuizWindowComponent} from "../components/quiz-window/quiz-window.component";
import {LogInComponent} from "../components/user/log-in/log-in.component";
import {SignUpComponent} from "../components/user/sign-up/sign-up.component";
import {VerifyComponent} from "../components/user/verify/verify.component";
import {SignUpSuccessComponent} from "../components/user/sign-up-success/sign-up-success.component";
import {AdminComponent} from "../components/admin/admin.component";

const routes: Routes = [
  {path: '', component: HomeWindowComponent},
  {path: 'home', component: HomeWindowComponent},
  {path: 'quiz', component: QuizWindowComponent},
  {path: 'admin', component: AdminComponent},
  {path: 'user/login', component: LogInComponent},
  {path: 'user/signup', component: SignUpComponent},
  {path: 'user/signup-success', component: SignUpSuccessComponent},
  {path: 'user/verify/:jwtToken', component: VerifyComponent},
  {path: '**', redirectTo: 'home'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingService {

  constructor() {
  }

}

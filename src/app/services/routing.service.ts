import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {HomeWindowComponent} from "../components/home-window/home-window.component";
import {QuizWindowComponent} from "../components/quiz-window/quiz-window.component";

const routes: Routes = [
  {path: 'home', component: HomeWindowComponent},
  {path: 'quiz', component: QuizWindowComponent},
  {path: '**', component: HomeWindowComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingService {

  constructor() {
  }

}

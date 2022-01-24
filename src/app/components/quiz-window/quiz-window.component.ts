import {Component, OnInit} from '@angular/core';
import {AppComponent} from "../../app.component";
import {GlobalProviderService} from "../../services/global-provider.service";

@Component({
  selector: 'app-quiz-window',
  templateUrl: './quiz-window.component.html',
  styleUrls: ['./quiz-window.component.css']
})
export class QuizWindowComponent implements OnInit {
  appComponent: AppComponent = GlobalProviderService.appComponent;
  questionNumber: number = 0;
  questionWordType: string = "";
  questionWord: string = "";
  options: string[] = [];

  constructor() {
  }

  ngOnInit(): void {
  }

}

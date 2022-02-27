import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AppComponent} from "../../app.component";
import {GlobalProviderService} from "../../services/global-provider.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-quiz-window',
  templateUrl: './quiz-window.component.html',
  styleUrls: ['./quiz-window.component.css']
})
export class QuizWindowComponent implements OnInit, AfterViewInit {
  appComponent: AppComponent = GlobalProviderService.appComponent;
  questionNumber: number = 0;
  maxQuestionCount: number = GlobalProviderService.questionCount;
  questionWordType: string = "";
  questionWord: string = "";
  options: string[];
  optionComponents: HTMLElement[] = [];

  constructor(router: Router) {
    if (this.maxQuestionCount == null) {
      router.navigate(["/"]).then().catch((err) => {
        console.log("Error when routing to main page.");
        console.log(err);
      });
    }
    this.options = Array(this.maxQuestionCount).fill("")
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    for (let i = 0; i < this.maxQuestionCount; i++) {
      let foundElement = document.getElementById("qw-option-" + i);
      if (foundElement) {
        this.optionComponents.push(foundElement);
      }
    }
  }

  selectOption = (optionNumber: number) => {
    // TODO : Complete this...
  };

}

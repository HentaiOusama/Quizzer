import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {AppComponent} from "../../app.component";
import {GlobalProviderService} from "../../services/global-provider.service";
import {Router} from "@angular/router";
import {QuizSet} from "../../models/quizSet/quiz-set.model";
import {QuestionHistory} from "../../models/quizSet/question-history.model";

@Component({
  selector: 'app-quiz-window',
  templateUrl: './quiz-window.component.html',
  styleUrls: ['./quiz-window.component.css']
})
export class QuizWindowComponent implements OnInit, AfterViewInit, OnDestroy {
  appComponent: AppComponent = GlobalProviderService.appComponent;
  optionComponents: HTMLElement[] = [];

  quizSet: QuizSet = JSON.parse(JSON.stringify(GlobalProviderService.quizSet));
  quizSetSelectableKeys: string[] = GlobalProviderService.questionTypes;
  maxQuestionCount: number = GlobalProviderService.questionCount;
  questionDuration: number = GlobalProviderService.questionDuration;
  showAnswers: boolean = GlobalProviderService.showAnswers;
  optionCount: number = 10;

  questionNumber: number = -1;
  questionWordType: string = "";
  questionWord: string = "";
  options: string[];
  selectedOption: number = -1;
  correctOption: number = -1;
  correctAnswer: string = "";

  isSelectionMode: boolean = true;
  canSelectOptions: boolean = true;
  showTimer: boolean = this.questionDuration !== 0;
  questionHistory: QuestionHistory = {};
  questionStartTime: number = 0;
  timeLeft: number = 0;
  intervalId: number = -1;
  nonChangeCount: number = 0;

  constructor(private router: Router, private changeDetectorRef: ChangeDetectorRef) {
    if (this.maxQuestionCount == null) {
      router.navigate(["/"]).then().catch((err) => {
        console.log("Error when navigating to main page.");
        console.log(err);
      });
    }
    this.options = Array(this.optionCount).fill("");
  }

  ngOnInit() {
    this.goToNextQuestion();
  }

  ngAfterViewInit() {
    for (let i = 0; i < this.optionCount; i++) {
      let foundElement = document.getElementById("qw-option-" + i);
      if (foundElement) {
        this.optionComponents.push(foundElement);
      }
    }
  }

  clearTimer = () => {
    if (this.intervalId !== -1) {
      clearInterval(this.intervalId);
      this.intervalId = -1;
    }
  };

  goToPreviousQuestion = () => {
    if (this.questionNumber > 0) {
      this.questionNumber -= 1;
      this.updateUIFromHistory();
    }
  };

  goToNextQuestion = () => {
    this.clearTimer();
    this.timeLeft = this.questionDuration;

    if (this.isSelectionMode) {
      this.canSelectOptions = true;

      if ((this.questionNumber + 1) < this.maxQuestionCount) {
        this.questionNumber += 1;
        this.selectedOption = -1;

        this.buildRandomQuestion();
        this.questionStartTime = Date.now();
        this.nonChangeCount = 0;

        if (this.showTimer) {
          this.intervalId = setInterval(() => {
            let timeLeft = this.questionDuration - (Math.floor((Date.now() - this.questionStartTime) / 1000));
            if (timeLeft < 0) {
              this.timeLeft = 0;
              this.selectOption(-1);
            } else {
              this.timeLeft = timeLeft;
              this.changeDetectorRef.detectChanges();
            }
          }, 200);
        }
      } else {
        this.isSelectionMode = false;
        this.canSelectOptions = false;
      }
      
      this.changeDetectorRef.detectChanges();
    } else {
      this.canSelectOptions = false;

      if ((this.questionNumber + 1) < this.maxQuestionCount) {
        this.questionNumber += 1;
        this.updateUIFromHistory();
      }
    }
  };

  updateUIFromHistory = () => {
    if ((0 <= this.questionNumber) && (this.questionNumber < this.maxQuestionCount)) {
      let historyElement = this.questionHistory[this.questionNumber];
      this.questionWordType = historyElement.questionType;
      this.questionWord = historyElement.questionWord;
      this.options = historyElement.options;
      this.selectedOption = historyElement.selectedOption;
      this.changeDetectorRef.detectChanges();
    }
  };

  selectOption = (optionNumber: number) => {
    if (optionNumber === -1) {
      this.goToNextQuestion();
    } else if (this.canSelectOptions) {
      this.canSelectOptions = false;
      this.questionHistory[this.questionNumber].selectedOption = optionNumber;
      this.selectedOption = optionNumber;
      if (optionNumber !== this.correctOption && this.options[optionNumber] === this.correctAnswer) {
        this.questionHistory[this.questionNumber].correctOption = optionNumber;
        this.correctOption = optionNumber;
      }

      if ((this.questionNumber + 1) >= this.maxQuestionCount) {
        this.goToNextQuestion();
      } else {
        this.clearTimer();
      }
    }
    this.changeDetectorRef.detectChanges();
  };

  getOptionBorderColor = (optionIndex: number) => {
    if (this.isSelectionMode && this.selectedOption === -1) {
      return this.appComponent.currentTheme.bsBorder;
    } else {
      if (optionIndex === this.correctOption) {
        return "#40a03c";
      } else if (optionIndex === this.selectedOption) {
        return "#9b1919";
      } else {
        return this.appComponent.currentTheme.bsBorder;
      }
    }
  };

  buildRandomQuestion = () => {
    let randomNumHolder = this.getUniqueRandomNumbers(0, this.quizSetSelectableKeys.length, 1);
    this.questionWordType = this.quizSetSelectableKeys[randomNumHolder[0]];

    let subKeys = Object.keys(this.quizSet[this.questionWordType]);
    randomNumHolder = this.getUniqueRandomNumbers(0, subKeys.length, 1);
    this.questionWord = subKeys[randomNumHolder[0]];
    let optSet = this.getRandomOptionsWithCorrectOption(GlobalProviderService.quizSet[this.questionWordType],
      this.quizSet[this.questionWordType][this.questionWord]);
    delete this.quizSet[this.questionWordType][this.questionWord];
    this.options = optSet.optionList;
    this.correctOption = optSet.correctOption;

    this.questionHistory[this.questionNumber] = {
      questionType: this.questionWordType,
      questionWord: this.questionWord,
      options: this.options,
      selectedOption: -1,
      correctOption: this.correctOption
    };
  };

  getRandomOptionsWithCorrectOption = (objectPool: { [keys: string]: any }, correctAnswer: string) => {
    this.correctAnswer = correctAnswer;
    let keySet = Object.keys(objectPool);
    let optionList = [];
    let randomNumbers = this.getUniqueRandomNumbers(0, keySet.length, this.optionCount);
    let editIndex = Math.floor((randomNumbers[0] * (this.optionCount - 1)) / (keySet.length - 1));
    let shouldEditOptions = true;

    let count = 0;
    for (let num of randomNumbers) {
      let option = objectPool[keySet[num]];
      if (shouldEditOptions && correctAnswer === option) {
        editIndex = count;
        shouldEditOptions = false;
      } else {
        count++;
      }
      optionList.push(option);
    }

    if (shouldEditOptions) {
      optionList[editIndex] = correctAnswer;
    }

    return {
      optionList,
      correctOption: editIndex
    };
  };

  getUniqueRandomNumbers = (startValue: number, endValue: number, numberOfValues: number) => {
    let rangeLength = endValue - startValue;
    if ((endValue <= startValue) || (numberOfValues > rangeLength) || (numberOfValues <= 0)) {
      throw "Invalid Params";
    }

    const numbers = Array(rangeLength).fill(0).map((_, index) => (startValue + index));
    numbers.sort(() => Math.random() - 0.5);
    return numbers.slice(0, numberOfValues);
  };

  ngOnDestroy() {
    if (this.intervalId !== -1) {
      clearInterval(this.intervalId);
    }
  }
}

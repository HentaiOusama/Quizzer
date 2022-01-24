import {Component, OnInit} from '@angular/core';
import {AppComponent} from "../../app.component";
import {GlobalProviderService} from "../../services/global-provider.service";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {Router} from "@angular/router";

interface ListElement {
  value: string,
  label: string
}

interface QuestionTypeFCGroup {
  [identifier: string]: FormControl
}

@Component({
  selector: 'app-home-window',
  templateUrl: './home-window.component.html',
  styleUrls: ['./home-window.component.css']
})
export class HomeWindowComponent implements OnInit {
  appComponent: AppComponent = GlobalProviderService.appComponent;
  questionCountsList: ListElement[] = [
    {value: "0", label: "All"},
    {value: "10", label: "10 Questions"},
    {value: "25", label: "25 Questions"},
    {value: "50", label: "50 Questions"},
    {value: "75", label: "75 Questions"},
    {value: "100", label: "100 Questions"},
    {value: "150", label: "150 Questions"},
    {value: "200", label: "200 Questions"}
  ];
  questionDurationsList: ListElement[] = [
    {value: "0", label: "No Limit"},
    {value: "5", label: "5 Seconds"},
    {value: "10", label: "10 Seconds"},
    {value: "15", label: "15 Seconds"},
    {value: "20", label: "20 Seconds"},
    {value: "30", label: "30 Seconds"},
    {value: "45", label: "45 Seconds"},
    {value: "60", label: "60 Seconds"}
  ];
  questionTypesList: ListElement[] = [];
  questionTypeFCGroup: QuestionTypeFCGroup = {};
  showAnswersList: ListElement[] = [
    {value: "true", label: "After Selecting an Option"},
    {value: "false", label: "After the End of Quiz"}
  ];
  userPreferenceForm: FormGroup;

  constructor(private router: Router, private formBuilder: FormBuilder) {
    let keys = Object.keys(GlobalProviderService.quizSet);

    for (let key of keys) {
      this.questionTypesList.push({
        value: key,
        label: key
      });
      this.questionTypeFCGroup[key + "FormControl"] = new FormControl(false);
    }

    this.userPreferenceForm = formBuilder.group({
      "questionCountControl": new FormControl(
        this.questionCountsList[0].value,
        Validators.required
      ),
      "questionDurationControl": new FormControl(
        this.questionDurationsList[0].value,
        Validators.required
      ),
      "questionTypeControl": new FormGroup(
        this.questionTypeFCGroup,
        this.requireCheckboxesToBeCheckedValidator()
      ),
      "showAnswerControl": new FormControl(
        this.showAnswersList[0].value,
        Validators.required
      )
    });
  }

  ngOnInit(): void {
  }

  requireCheckboxesToBeCheckedValidator = (minRequired: number = 1): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      let formGroupControlSet = (<FormGroup>control).controls;
      let keySet = Object.keys(formGroupControlSet);
      let checkedCount = 0;

      for (let key of keySet) {
        if (formGroupControlSet[key].value) {
          checkedCount++;
        }
      }

      return (checkedCount >= minRequired) ? null : {minCheckboxesChecked: {value: checkedCount}};
    };
  };

  startQuiz = () => {
    if (this.userPreferenceForm.status !== "VALID") {
      return;
    }
    GlobalProviderService.questionCount = parseInt(this.userPreferenceForm.controls["questionCountControl"].value)
    GlobalProviderService.questionDuration = parseInt(this.userPreferenceForm.controls["questionDurationControl"].value);
    GlobalProviderService.questionTypes = [];
    GlobalProviderService.showAnswers = this.userPreferenceForm.controls["showAnswerControl"].value === "true";

    let maxPossibleQuestions = 0;
    let questionTypeFormGroup = <FormGroup>this.userPreferenceForm.controls["questionTypeControl"];
    let keys = Object.keys(this.questionTypeFCGroup);
    for (let key of keys) {
      if (questionTypeFormGroup.controls[key].value) {
        let insertValue = key.replace("FormControl", "");
        GlobalProviderService.questionTypes.push(insertValue);
        maxPossibleQuestions += Object.keys(GlobalProviderService.quizSet[insertValue]).length;
      }
    }
    if (GlobalProviderService.questionCount === 0 || GlobalProviderService.questionCount > maxPossibleQuestions) {
      GlobalProviderService.questionCount = maxPossibleQuestions;
    }

    this.router.navigate(['/quiz']).then().catch((err) => {
      console.log("Error when routing to Quiz page...");
      console.log(err);
    });
  };
}

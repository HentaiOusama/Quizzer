import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
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
import {SocketIOService} from "../../services/socket-io.service";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  appComponent: AppComponent = GlobalProviderService.appComponent;
  addWordForm: FormGroup;
  wordGroupList: string[] = [];
  canClickOnButton: boolean = true;
  userMessage: string = "";
  userMessageColor: string = "";
  shouldShowUserMessage: boolean = false;

  constructor(private changeDetectorRef: ChangeDetectorRef, private formBuilder: FormBuilder) {
    this.wordGroupList = Object.keys(GlobalProviderService.quizSet);
    this.wordGroupList.push("Custom");

    this.addWordForm = formBuilder.group({
      "questionTypeControl": new FormControl(
        this.wordGroupList[0],
        Validators.required
      ),
      "customQuestionTypeControl": new FormControl(
        "",
        <ValidatorFn>this.requireUniqueType
      ),
      "wordControl": new FormControl(
        "",
        Validators.required
      ),
      "meaningControl": new FormControl(
        "",
        Validators.required
      )
    });

    this.addWordForm.valueChanges.subscribe(() => {
      if (this.addWordForm.value["questionTypeControl"] !== "Custom" && this.addWordForm.value["customQuestionTypeControl"] !== "") {
        this.addWordForm.controls["customQuestionTypeControl"].setValue("");
      }
      this.changeDetectorRef.detectChanges();
    });

    SocketIOService.setActionForEvent('addWordSuccess', (data) => {
      this.canClickOnButton = true;
      if (GlobalProviderService.quizSet[data["collectionName"]] == null) {
        GlobalProviderService.quizSet[data["collectionName"]] = {};
      }
      GlobalProviderService.quizSet[data["collectionName"]][data["word"]] = data["meaning"];
      this.computeWordGroupList();
      this.userMessage = "Success";
      this.userMessageColor = "#1cd000";
      this.shouldShowUserMessage = true;
      this.resetAddWordForm();
      this.changeDetectorRef.detectChanges();
      setTimeout(() => {
        this.shouldShowUserMessage = false;
        this.changeDetectorRef.detectChanges();
      }, 2500);
    });
    SocketIOService.setActionForEvent('addWordUnsuccessful', () => {
      this.canClickOnButton = true;
      this.userMessage = "Error";
      this.userMessageColor = "#d00000";
      this.shouldShowUserMessage = true;
      this.resetAddWordForm();
      this.changeDetectorRef.detectChanges();
      setTimeout(() => {
        this.shouldShowUserMessage = false;
        this.changeDetectorRef.detectChanges();
      }, 2500);
    });
  }

  ngOnInit(): void {
    SocketIOService.emitEventToServer('sendQuizSet', null);
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    }, 2500);
  }

  isButtonDisabled = () => {
    return ((this.addWordForm.status !== "VALID") || (this.shouldShowUserMessage));
  };

  computeWordGroupList = () => {
    this.wordGroupList = Object.keys(GlobalProviderService.quizSet);
    this.wordGroupList.push("Custom");
    this.changeDetectorRef.detectChanges();
  };

  requireUniqueType = (control: AbstractControl): ValidationErrors | null => {
    let returnValue = null;

    if (this.addWordForm && this.addWordForm.value["questionTypeControl"] === "Custom") {
      if (!control.value) {
        returnValue = {isValuePresent: {value: false}};
      } else if (GlobalProviderService.quizSet[control.value] != null) {
        returnValue = {isTypeUnique: {value: false}};
      }
    }

    return returnValue;
  };

  sendAddWordPacketToServer = () => {
    if (this.canClickOnButton && this.addWordForm.status === "VALID") {
      this.canClickOnButton = false;

      let collectionName = this.addWordForm.value["questionTypeControl"];
      if (collectionName === "Custom") {
        collectionName = this.addWordForm.value["customQuestionTypeControl"]
      }
      collectionName = collectionName.replace(/^[\n\r\s]+|[\n\r\s]+$/gm, '');

      SocketIOService.emitEventToServer('addNewWord', {
        collectionName,
        "word": this.addWordForm.value["wordControl"].replace(/^[\n\r\s]+|[\n\r\s]+$/gm, ''),
        "meaning": this.addWordForm.value["meaningControl"].replace(/^[\n\r\s]+|[\n\r\s]+$/gm, '')
      });
    }
  };

  resetAddWordForm = () => {
    let previousValue = this.addWordForm.value["questionTypeControl"];
    this.addWordForm.reset();
    this.addWordForm.controls["questionTypeControl"].setValue(previousValue);
  };

  ngOnDestroy() {
    SocketIOService.emitEventToServer('sendQuizSet', null);
  }
}

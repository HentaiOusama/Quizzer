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
        {disabled: true, value: ""}, {
          validators: <ValidatorFn>this.requireUniqueType,
          updateOn: "change"
        }
      ),
      "wordControl": new FormControl(
        {disabled: false, value: ""}, {
          validators: <ValidatorFn>this.requiredIfNotFileMode,
          updateOn: "change"
        }
      ),
      "meaningControl": new FormControl(
        {disabled: false, value: ""}, {
          validators: <ValidatorFn>this.requiredIfNotFileMode,
          updateOn: "change"
        }
      ),
      "fileModeControl": new FormControl(false)
    });

    this.addWordForm.controls["questionTypeControl"].valueChanges.subscribe((value) => {
      if (value === "Custom") {
        this.addWordForm.controls["customQuestionTypeControl"].setValue("");
        this.addWordForm.controls["customQuestionTypeControl"].enable();
      } else {
        this.addWordForm.controls["customQuestionTypeControl"].disable();
      }
    });
    this.addWordForm.controls["fileModeControl"].valueChanges.subscribe((value) => {
      if (value) {
        this.addWordForm.controls["wordControl"].setValue("");
        this.addWordForm.controls["meaningControl"].setValue("");
        this.addWordForm.controls["wordControl"].disable();
        this.addWordForm.controls["meaningControl"].disable();
      } else {
        this.addWordForm.controls["wordControl"].enable();
        this.addWordForm.controls["meaningControl"].enable();
      }
    });
    this.addWordForm.valueChanges.subscribe(() => {
      this.changeDetectorRef.detectChanges();
    });

    SocketIOService.setActionForEvent('addWordSuccess', (data) => {
      if (GlobalProviderService.quizSet[data["collectionName"]] == null) {
        GlobalProviderService.quizSet[data["collectionName"]] = {};
      }
      GlobalProviderService.quizSet[data["collectionName"]][data["word"]] = data["meaning"];
      this.computeWordGroupList();
      this.postResponseAction("Success", "#1cd000");
    });
    SocketIOService.setActionForEvent('addWordsFromFileSuccess', () => {
      SocketIOService.emitEventToServer("sendQuizSet", null);
      this.postResponseAction("Success", "#1cd000");
    });
    SocketIOService.setActionForEvent('addWordUnsuccessful', () => {
      this.postResponseAction("Error", "#d00000");
    });
    SocketIOService.setActionForEvent('addWordsFromFileUnsuccessful', () => {
      this.postResponseAction("Error", "#d00000");
    });
  }

  ngOnInit(): void {
    SocketIOService.emitEventToServer('sendQuizSet', null);
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    }, 2500);
  }

  postResponseAction = (userMessage: string, setColor: string) => {
    this.canClickOnButton = true;
    this.userMessage = userMessage;
    this.userMessageColor = setColor;
    this.shouldShowUserMessage = true;
    this.resetAddWordForm();
    this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      this.shouldShowUserMessage = false;
      this.changeDetectorRef.detectChanges();
    }, 2500);
  };

  isButtonDisabled = () => {
    return ((this.addWordForm.status !== "VALID") || (this.shouldShowUserMessage) || (!this.canClickOnButton));
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

  requiredIfNotFileMode = (control: AbstractControl): ValidationErrors | null => {
    let returnValue = null;

    if (this.addWordForm && !this.addWordForm.value["fileModeControl"]) {
      if (!control.value) {
        returnValue = {"doesValueExist": {"value": false}};
      }
    }

    return returnValue;
  };

  sendAddWordPacketToServer = () => {
    if (this.canClickOnButton && this.addWordForm.status === "VALID") {
      this.canClickOnButton = false;
      this.changeDetectorRef.detectChanges();

      let collectionName = this.addWordForm.value["questionTypeControl"];
      if (collectionName === "Custom") {
        collectionName = this.addWordForm.value["customQuestionTypeControl"]
      }
      collectionName = collectionName.replace(/^[\n\r\s]+|[\n\r\s]+$/gm, '');

      if (this.addWordForm.value["fileModeControl"]) {
        SocketIOService.emitEventToServer('addWordsFromFile', {
          collectionName
        });
      } else {
        SocketIOService.emitEventToServer('addNewWord', {
          collectionName,
          "word": this.addWordForm.value["wordControl"].replace(/^[\n\r\s]+|[\n\r\s]+$/gm, ''),
          "meaning": this.addWordForm.value["meaningControl"].replace(/^[\n\r\s]+|[\n\r\s]+$/gm, '')
        });
      }
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

import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AppComponent} from "../../../app.component";
import {GlobalProviderService} from "../../../services/global-provider.service";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {SocketIOService} from "../../../services/socket-io.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {
  appComponent: AppComponent = GlobalProviderService.appComponent;
  signUpForm: FormGroup;
  signUpDisplayMessage: string = "";
  canClickOnButton: boolean = true;

  constructor(private changeDetectorRef: ChangeDetectorRef, private router: Router, private formBuilder: FormBuilder) {
    this.signUpForm = formBuilder.group({
      "emailControl": new FormControl("", [Validators.email, Validators.required]),
      "passwordControl": new FormControl("", Validators.required),
      "confirmPasswordControl": new FormControl("", [Validators.required, this.sameValueValidator])
    });

    this.signUpForm.valueChanges.subscribe(() => {
      this.canClickOnButton = true;
      this.changeDetectorRef.detectChanges();
    });

    SocketIOService.setActionForEvent("signupUnsuccessful", (reason) => {
      this.signUpDisplayMessage = reason.replace("UserMail", "Email");
      this.changeDetectorRef.detectChanges();
    });

    SocketIOService.setActionForEvent("signupSuccess", () => {
      this.router.navigate(['/user/signup-success']).then().catch((err) => {
        console.log("Error when routing back to log in page...");
        console.log(err);
      });
    });
  }

  ngOnInit(): void {
    if (this.appComponent.isUserLoggedIn) {
      this.router.navigate(['/home']).then().catch();
    }
  }

  sameValueValidator = (): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      return (control.value === this.signUpForm.value["passwordControl"]) ? null : {doesPasswordMatch: {value: false}};
    };
  };

  sendSignUpInfoToServer = () => {
    if (this.canClickOnButton && this.signUpForm.status === "VALID") {
      this.canClickOnButton = false;
      setTimeout(() => {
        this.canClickOnButton = true;
      }, 5000);
      SocketIOService.emitEventToServer("userSignup", {
        "userMail": this.signUpForm.value["emailControl"],
        "password": this.signUpForm.value["passwordControl"]
      });
    }
  };
}

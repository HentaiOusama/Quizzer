import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AppComponent} from "../../../app.component";
import {GlobalProviderService} from "../../../services/global-provider.service";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {SocketIOService} from "../../../services/socket-io.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.css']
})
export class LogInComponent implements OnInit {
  appComponent: AppComponent = GlobalProviderService.appComponent;
  logInForm: FormGroup;
  logInErrorReason: string = "";
  canClickOnButton: boolean = true;

  constructor(private changeDetectorRef: ChangeDetectorRef, private router: Router, private formBuilder: FormBuilder) {
    this.logInForm = formBuilder.group({
      "emailControl": new FormControl("", [Validators.email, Validators.required]),
      "passwordControl": new FormControl("", Validators.required),
      "rememberControl": new FormControl(false)
    });

    this.logInForm.valueChanges.subscribe(() => {
      this.canClickOnButton = true;
      this.changeDetectorRef.detectChanges();
    });

    SocketIOService.setActionForEvent("loginUnsuccessful", (reason) => {
      this.logInErrorReason = reason.replace("UserMail", "Email");
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnInit(): void {
    if (this.appComponent.isUserLoggedIn) {
      this.router.navigate(['/home']).then().catch();
    }
  }

  sendLogInInfoToServer = () => {
    if (this.canClickOnButton && this.logInForm.status === "VALID") {
      this.canClickOnButton = false;
      setTimeout(() => {
        this.canClickOnButton = true;
      }, 3000);
      SocketIOService.emitEventToServer("userLogin", {
        "userMail": this.logInForm.value["emailControl"],
        "password": this.logInForm.value["passwordControl"],
        "rememberMe": this.logInForm.value["rememberControl"]
      });
    }
  };
}

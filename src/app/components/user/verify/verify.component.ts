import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AppComponent} from "../../../app.component";
import {GlobalProviderService} from "../../../services/global-provider.service";
import {ActivatedRoute, Router} from "@angular/router";
import {SocketIOService} from "../../../services/socket-io.service";

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css']
})
export class VerifyComponent implements OnInit {
  appComponent: AppComponent = GlobalProviderService.appComponent;
  shouldEmitToServer: boolean = true;
  displayMessage: string = "Waiting for confirmation from server";

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef) {
    activatedRoute.paramMap.subscribe((paramMap) => {
      let jwtToken = paramMap.get("jwtToken");
      if (this.shouldEmitToServer && jwtToken != null && jwtToken !== "") {
        SocketIOService.emitEventToServer('userVerification', {
          "jwtToken": jwtToken
        });
        this.shouldEmitToServer = false;
      }
    });

    SocketIOService.setActionForEvent('verificationSuccess', () => {
      this.displayMessage = "Account Verified. You can now proceed to login to your account. (Redirecting automatically in 5 seconds)";
      this.changeDetectorRef.detectChanges();
      setTimeout(() => {
        this.router.navigate(['/user/login']).then().catch();
      }, 5000);
    });

    SocketIOService.setActionForEvent('verificationUnsuccessful', (reason) => {
      this.displayMessage = "Verification Failed. " + reason;
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnInit(): void {
  }
}

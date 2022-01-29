import {Component, OnInit} from '@angular/core';
import {AppComponent} from "../../../app.component";
import {GlobalProviderService} from "../../../services/global-provider.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-sign-up-success',
  templateUrl: './sign-up-success.component.html',
  styleUrls: ['./sign-up-success.component.css']
})
export class SignUpSuccessComponent implements OnInit {

  appComponent: AppComponent = GlobalProviderService.appComponent;

  constructor(private router: Router) {
  }

  ngOnInit(): void {
  }

  goToLogInPage = () => {
    this.router.navigate(['/user/login']).then().catch();
  };
}

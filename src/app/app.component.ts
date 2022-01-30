import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Theme} from "./models/theme/theme.model";
import {ThemeService} from "./services/theme-service.service";
import {NavigationEnd, Router} from "@angular/router";
import {GlobalProviderService} from "./services/global-provider.service";
import {WebStorageService} from "./services/web-storage.service";
import {SocketIOService} from "./services/socket-io.service";
import {QuizSet} from "./models/quizSet/quiz-set.model";
import {CookieService} from "./services/cookie.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'Quizzer';
  currentTheme: Theme;
  showLoader: boolean = true;
  navType: string = "main"
  navHeight: string = "50vh";
  mainNavOpacity: string = "1";
  isLocalStorageAvailable: boolean = false;
  localQuizSetVersion: string | null = null;
  isUserLoggedIn: boolean = false;
  isUserAdmin: boolean = false;
  logInText: string = "Log In";

  constructor(public router: Router, private changeDetectorRef: ChangeDetectorRef) {
    GlobalProviderService.appComponent = this;
    this.currentTheme = ThemeService.getTheme(0);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (router.url === "/") {
          this.navHeight = "50vh";
          this.navType = "main";
          this.mainNavOpacity = "1";
        } else {
          this.navHeight = "5vh";
          this.navType = "mini";
          this.mainNavOpacity = "0";
        }

        this.changeDetectorRef.detectChanges();
      }
    });

    SocketIOService.setActionForEvent("latestQuizSetVersion", (quizSetVersion) => {
      if (quizSetVersion === this.localQuizSetVersion) {
        let quizSet = WebStorageService.getItemFromStorage("localStorage", "quizSet");
        if (quizSet == null) {
          SocketIOService.emitEventToServer("sendQuizSet", null);
        } else {
          try {
            GlobalProviderService.quizSet = <QuizSet>JSON.parse(quizSet);
            GlobalProviderService.didReceiveQuizSet = true;
            this.showLoader = false;
            this.changeDetectorRef.detectChanges();
          } catch {
            SocketIOService.emitEventToServer("sendQuizSet", null);
          }
        }
      } else {
        SocketIOService.emitEventToServer("sendQuizSet", null);
      }
    });
    SocketIOService.setActionForEvent("latestQuizSet", (data) => {
      this.localQuizSetVersion = data["quizSetVersion"];
      GlobalProviderService.quizSet = <QuizSet>data["quizSet"];
      GlobalProviderService.didReceiveQuizSet = true;
      if (this.isLocalStorageAvailable) {
        WebStorageService.setItemInStorage("localStorage", "quizSetVersion", <string>this.localQuizSetVersion);
        WebStorageService.setItemInStorage("localStorage", "quizSet", JSON.stringify(data["quizSet"]));
      }
      this.showLoader = false;
      this.changeDetectorRef.detectChanges();
    });
    SocketIOService.setActionForEvent("adminPrivilegeGranted", () => {
      this.isUserAdmin = true;
      this.changeDetectorRef.detectChanges();
    });
    SocketIOService.setActionForEvent("loginSuccess", (data) => {
      this.logInText = data["userMail"].substring(0, 2).toUpperCase();
      this.isUserLoggedIn = true;
      if (data["newSessionId"] != null && this.isLocalStorageAvailable) {
        CookieService.setCookie({
          "name": "userMail",
          "value": data["userMail"],
          "expireDays": 15
        });
        CookieService.setCookie({
          "name": "sessionId",
          "value": data["newSessionId"],
          "expireDays": 15
        });
        this.changeDetectorRef.detectChanges();
      }

      if (this.router.url === "/user/login") {
        this.router.navigate(["/home"]).then().catch((err) => {
          console.log("Error when redirecting to home after login success");
          console.log(err);
        });
      }
    });
  }

  ngOnInit() {
    document.body.style.backgroundColor = this.currentTheme.background;

    let userMail = CookieService.getCookie("userMail");
    if (userMail != null && userMail !== "") {
      let sessionId = CookieService.getCookie("sessionId");
      SocketIOService.emitEventToServer("userLogin", {
        userMail,
        sessionId
      });
    }

    this.isLocalStorageAvailable = WebStorageService.isStorageAvailable("localStorage");
    if (this.isLocalStorageAvailable) {
      this.localQuizSetVersion = WebStorageService.getItemFromStorage("localStorage", "quizSetVersion");
    }
    SocketIOService.emitEventToServer("sendLatestQuizSetVersion", null);
  }

  ngAfterViewInit() {
  }

  showHomeWindow = () => {
    this.navHeight = "5vh";
    this.mainNavOpacity = "0";
    this.changeDetectorRef.detectChanges();

    setTimeout(() => {
      this.navType = "mini";
      this.changeDetectorRef.detectChanges();

      this.router.navigate(['/home']).then().catch((err) => {
        console.log("Error while routing to home");
        console.log(err);
      });
    }, 550);
  };

  logInButtonAction = () => {
    if (!this.isUserLoggedIn) {
      this.router.navigate(['/user/login']).then().catch((err) => {
        console.log("Error while routing to Log in Page");
        console.log(err);
      });
    } else {
      // TODO : Show floating div with options. Like log out.
    }
  };

  goToHomePage = () => {
    this.router.navigate(['/home']).then().catch((err) => {
      console.log("Error while routing to home");
      console.log(err);
    });
  };

  goToAdminPage = () => {
    this.router.navigate(['/admin']).then().catch((err) => {
      console.log("Error while routing to admin");
      console.log(err);
    });
  };
}

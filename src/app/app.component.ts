import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Theme} from "./models/theme/theme.model";
import {ThemeService} from "./services/theme-service.service";
import {NavigationEnd, Router} from "@angular/router";
import {GlobalProviderService} from "./services/global-provider.service";
import {WebStorageService} from "./services/web-storage.service";
import {SocketIOService} from "./services/socket-io.service";
import {QuizSet} from "./models/quizSet/quiz-set.model";

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
  }

  ngOnInit() {
    document.body.style.backgroundColor = this.currentTheme.background;
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
    setTimeout(() => {
      this.navType = "mini";
      this.changeDetectorRef.detectChanges();

      this.router.navigate(['/home']).then().catch((err) => {
        console.log("Error while routing to home");
        console.log(err);
      });
    }, 450);
  };
}

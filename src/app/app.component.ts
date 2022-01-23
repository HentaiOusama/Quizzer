import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Theme} from "./models/theme/theme.model";
import {ThemeService} from "./services/theme-service.service";
import {NavigationEnd, Router} from "@angular/router";

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

  constructor(public router: Router, private changeDetectorRef: ChangeDetectorRef) {
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
  }

  ngOnInit() {
    document.body.style.backgroundColor = this.currentTheme.background;
  }

  ngAfterViewInit() {
    this.showLoader = false;
  }

  shouldShowLoadingScreen = () => {
    return this.showLoader;
  };

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

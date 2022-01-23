import {Component, OnInit} from '@angular/core';
import {Theme} from "./models/theme/theme.model";
import {ThemeService} from "./services/theme-service.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Quizzer';
  currentTheme: Theme;

  constructor() {
    this.currentTheme = ThemeService.getTheme(0);
  }

  ngOnInit() {
    document.body.style.backgroundColor = this.currentTheme.background;
  }

  shouldShowLoadingScreen = () => {
    return true;
  };
}

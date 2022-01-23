import {Theme} from "../models/theme/theme.model";

export abstract class ThemeService {

  static themeList: Theme[] = [
    new Theme(
      "#222831",
      "#393e46",
      "#00adb5",
      "#eeeeee",
      "#eeeeee",
      "#00adb5",
      "#393e46",
      "#222831"
    )
  ];

  static getTheme = (themeIndex: number) => {
    return this.themeList[themeIndex];
  };
}

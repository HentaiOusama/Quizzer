import {Theme} from "../models/theme/theme.model";

export abstract class ThemeService {

  static themeList: Theme[] = [
    new Theme(
      "#222831",
      "#393e46",
      "#5e636b",
      "#00adb5",
      "#4ecca3",
      "#eeeeee",
      "#eeeeee",
      "#4ecca3",
      "#00adb5",
      "#343941",
      "#272c34",
      "#151b25",
      "#deb887ff",
      "#e07306"
    )
  ];

  static getTheme = (themeIndex: number) => {
    return this.themeList[themeIndex];
  };
}

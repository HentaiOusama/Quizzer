import {Injectable} from '@angular/core';
import {AppComponent} from "../app.component";
import {QuizSet} from "../models/quizSet/quiz-set.model";

@Injectable({
  providedIn: 'root'
})
export abstract class GlobalProviderService {
  static appComponent: AppComponent;
  static didReceiveQuizSet: boolean = false;
  static quizSet: QuizSet = {};
  static questionCount: number;
  static questionDuration: number;
  static questionTypes: string[];
  static showAnswers: boolean;
}

import {Question} from "./question.model";

export interface QuizSet {
  [questionType: string]: Question[]
}

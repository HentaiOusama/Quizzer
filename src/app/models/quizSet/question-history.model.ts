export interface QuestionHistory {
  [questionNumber: number]: {
    questionType: string;
    questionWord: string;
    options: string[];
    selectedOption: number;
    correctOption: number;
  }
}

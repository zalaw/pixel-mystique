import { AnswerType } from "./AnswerType";

export type RoundType = {
  id: string;
  originalImage: ArrayBuffer;
  image: ArrayBuffer;
  answers: AnswerType[];
  correctAnswerId: string;
};

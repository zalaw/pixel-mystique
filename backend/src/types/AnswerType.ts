import { ClientType } from "./ClientType";

export type AnswerType = {
  id: string;
  text: string;
  pickedBy: Pick<ClientType, "id" | "index" | "name">[];
};

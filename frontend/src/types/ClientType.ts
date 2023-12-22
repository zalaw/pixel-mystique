export type ClientValue = boolean | string;

export type ClientType = {
  id: string;
  index: number;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isAnswerPicked: boolean;
};

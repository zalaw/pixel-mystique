import { ScenarioImageType } from "./ScenarioImageType";

export type ScenarioItemType = {
  _id?: string;
  name: string;
  images: ScenarioImageType[];
};

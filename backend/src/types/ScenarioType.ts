import { ScenarioItemType } from "./ScenarioItemType";

export type ScenarioType = {
  _id?: string;
  name: string;
  items: ScenarioItemType[];
};

import { ClientType } from "./ClientType";
import { RoundType } from "./RoundType";
import { ScenarioType } from "./ScenarioType";

export type SettingsValue = null | boolean | string | number;
export type RoomStatusType = "lobby" | "in-game" | "finished";

export type RoomSettingsType = {
  scenario: string;
  seconds: number;
  rounds: number;
  grayscale: boolean;
  pixelatedValue: number;
};

export type RoomType = {
  code: string;
  scenarios: ScenarioType[];
  clients: ClientType[];
  status: RoomStatusType;
  settings: RoomSettingsType;
  currentRoundIndex: number;
  rounds: RoundType[];
};

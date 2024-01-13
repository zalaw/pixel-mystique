import mongoose from "mongoose";
import { ScenarioType } from "../types/ScenarioType";
import { ScenarioItemType } from "../types/ScenarioItemType";
import { ScenarioImageType } from "../types/ScenarioImageType";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  dislikes: { type: Number, default: 0 },
});

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  images: [imageSchema],
});

const scenarioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  items: [itemSchema],
});

const ScenarioModel = mongoose.model("scenario", scenarioSchema);

export default ScenarioModel;

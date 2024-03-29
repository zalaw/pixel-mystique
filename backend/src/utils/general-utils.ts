import { RoundType } from "../types/RoundType";
import { AnswerType } from "../types/AnswerType";
import crypto from "crypto";
import Jimp from "jimp";
import { ScenarioItemType } from "../types/ScenarioItemType";
import ScenarioModel from "../models/Scenario";

const scenarios = [
  {
    name: "Scenario 1",
    data: {
      images: [
        {
          link: "link1",
          dislikes: 0,
        },
      ],
    },
  },
];

const explicitKeywords = [
  "porn",
  "pornstar",
  "adult content",
  "explicit",
  "xxx",
  "nsfw",
  "sex",
  "nude",
  "erotic",
  "intimate",
  "sensual",
  "nudity",
  "obscene",
  "vulgar",
  "sexual",
  "kinky",
  "fetish",
  "hardcore",
  "x-rated",
  "uncensored",
  "lust",
  "pleasure",
  "seduce",
  "intimacy",
  "naughty",
  "erogenous",
  "desire",
  "passion",
];

export const containsExplicitContent = (input: string) => {
  const sanitized = input.toLocaleLowerCase();

  return explicitKeywords.some(keyword => sanitized.includes(keyword));
};

export const delayWithError = (time: number = 1000) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      rej();
    }, time);
  });
};

export const shuffleArray = <T>(input: T[]) => {
  const result = [...input];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

export const getPossibleAnswers = (correctAnswer: string, pool: string[], size: number = 4): AnswerType[] => {
  const poolExceptCorrectAnswer = pool.filter(entry => entry !== correctAnswer);
  const poolShuffled = shuffleArray(poolExceptCorrectAnswer)
    .slice(0, size - 1)
    .map(entry => ({ id: crypto.randomUUID(), text: entry, pickedBy: [] }))
    .concat([{ id: crypto.randomUUID(), text: correctAnswer, pickedBy: [] }]);

  return shuffleArray(poolShuffled);
};

export const generateRounds = async (
  pixelatedValue: number,
  grayscale: boolean,
  pool: ScenarioItemType[],
  size: number = 10
): Promise<RoundType[]> => {
  const shuffled = shuffleArray(pool).slice(0, size);
  const rounds = await Promise.all(
    shuffled.map(async entry => {
      const selectedImage = entry.images[Math.floor(Math.random() * entry.images.length)];

      const image = await Jimp.read(selectedImage.url);
      const originaImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      image.resize(Jimp.AUTO, 500);
      image.pixelate((pixelatedValue * image.bitmap.width) / 1000);

      if (grayscale) image.grayscale();

      const round: RoundType = {
        id: crypto.randomUUID(),
        originalImage: originaImageBuffer,
        image: await image.getBufferAsync(Jimp.MIME_JPEG),
        answers: getPossibleAnswers(
          entry.name,
          pool.map(entry => entry.name),
          4
        ),
        correctAnswerId: "",
        imageId: `${entry._id?.toString() || ""}|${selectedImage._id?.toString() || ""}`,
      };

      round.correctAnswerId = round.answers.find(answer => answer.text === entry.name)?.id || "";

      return round;
    })
  );

  return rounds;
};

export const updateImageDislikes = async (scenarioId: string, id: string) => {
  try {
    const [itemId, imageId] = id.split("|");
    const scenario = await ScenarioModel.findById(scenarioId);

    if (!scenario) throw new Error("Scenario not found");

    const scenarioItem = scenario.items.id(itemId);

    if (!scenarioItem) throw new Error("Scenario item not found");

    const scenarioImage = scenarioItem.images.id(imageId);

    if (!scenarioImage) throw new Error("Scenario image not found");

    scenarioImage.dislikes += 1;

    await scenario?.save();
  } catch (err) {
    throw err;
  }
};

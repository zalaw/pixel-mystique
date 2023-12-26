import { RoundType } from "../types/RoundType";
import { AnswerType } from "../types/AnswerType";
import crypto from "crypto";
import Jimp from "jimp";

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
  pool: { name: string; imageURL: string }[],
  size: number = 10
): Promise<RoundType[]> => {
  const shuffled = shuffleArray(pool).slice(0, size);
  const rounds = await Promise.all(
    shuffled.map(async entry => {
      // const originalImage = await Jimp.read(entry.imageURL);
      const image = await Jimp.read(entry.imageURL);
      const originaImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      image.pixelate(pixelatedValue);

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
      };

      round.correctAnswerId = round.answers.find(answer => answer.text === entry.name)?.id || "";

      return round;
    })
  );

  return rounds;
};

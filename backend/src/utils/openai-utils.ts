import OpenAI from "openai";

export const getList = async (query: string, size: number = 20) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Give me a list of ${size} ${query}. Each item should be inside '<item>...</item>' tags.`,
      },
    ],
    model: "gpt-3.5-turbo",
  });

  const regex = /<item>(.*?)<\/item>/g;

  return Array.from((chatCompletion.choices[0].message.content || "").matchAll(regex), match => match[1]);
};

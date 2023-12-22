import OpenAI from "openai";

export const getList = async (query: string, size: number = 20) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Give me a list of ${size} ${query}. Your response should only contain the list`,
      },
    ],
    model: "gpt-3.5-turbo",
  });

  return (
    chatCompletion.choices[0].message.content
      ?.split(/\d+\./)
      .map(entry => entry.trim())
      .filter(entry => entry) || []
  );
};

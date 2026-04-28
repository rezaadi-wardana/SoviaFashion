import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function main() {
  try {
    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: "Generate an image of a red apple",
        },
      ]
    });
    
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error(error);
  }
}

main();

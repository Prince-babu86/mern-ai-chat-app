import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateResponse(content) {
  let retries = 3;

  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: content,
      });

      if (!response.text) {
        throw new Error("AI returned empty response");
      }

      return response.text;
    } catch (error) {
      if (error.status === 503) {
        retries--;
        console.log("AI busy, retrying...");

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }

  throw new Error("AI service overloaded. Try again later.");
}

export default {
  generateResponse,
};

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

// console.log(process.env.GEMINI_API_KEY);

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({});

async function generateResponse(content) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: content,
    });


    if(!response.text){
        return  new Error("error", "AI unavailable, try later");
    }

    return response.text;
  } catch (error) {
    console.log("Something went wrong and limits are full :" );
  }
}

export default {
  generateResponse,
};

import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.Index({
  name: "chatbot",
  host: "https://chatbot-5yzvao2.svc.aped-4627-b74a.pinecone.io",
});

const createMemory = async ({ vectors, metadata, messageId }) => {
  try {
    const records = [
    {
      id: messageId,
      values: vectors,
      metadata,
    },
  ];

  await index.upsert({
    records: records,
  });
  } catch (error) {
    console.log(error.message);
  }
};

const queryMemory = async ({ queryVector, limit = 5, filter }) => {
  const data = await index.query({
    vector: queryVector,
    topK: limit,
    filter: filter || undefined,
    includeMetadata: true,
  });
  return data.matches;
};

export default { createMemory, queryMemory };

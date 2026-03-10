import aiService from "../services/ai.service.js";
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

export async function pineconeCreate(req, res) {
  try {
    // hardcoded fake vector - 768 zeros
    const fakeVector = new Array(768).fill(0.1);

    const index = pc.Index({
      name: "chatgptproject",
      host: "https://chatgptproject-5yzvao2.svc.aped-4627-b74a.pinecone.io",
    });

    const recors = await index.upsert({
      records: [
        {
          id: Date.now().toString(),
          values: fakeVector,
          metadata: {
            user: req.user._id.toString(),
          },
        },
      ],
    });

    res.status(200).json({ success: true, recors });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
}

import { pinecone } from "@/src/utils/pinecone-client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest,
  res: NextApiResponse,) {
    try {
      const index = await pinecone.Index(process.env.PINECONE_INDEX_NAME || "test-index");
      const indexStats = await index.describeIndexStats({
        describeIndexStatsRequest: {},
      })
  
  
      if (indexStats && !indexStats.namespaces ) {
        return res.json("No namespaces found");
      } else if (indexStats && indexStats.namespaces) {
        return res.json(Object.keys(indexStats.namespaces));
      }
  
    } catch (error) {
        return res.status(500).json({ message: error });
    }
  }
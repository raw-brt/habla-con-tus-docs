import { pinecone } from '@/utils/pinecone-client';
import { useState } from 'react';

export const useGetIndexNamespaces = async () => {
  const [namespaces, setNamespaces] = useState([]);

  try {
    const index = await pinecone.Index(process.env.PINECONE_INDEX_NAME || "test-index");
    const indexStats = await index.describeIndexStats({
      describeIndexStatsRequest: {},
    })


    if (indexStats && indexStats.namespaces) {
      setNamespaces(indexStats.namespaces)
    }

  } catch (error) {
    console.log(error)
  }

  return namespaces;
}

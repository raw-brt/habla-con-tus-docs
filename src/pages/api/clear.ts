import { pinecone } from '@/src/utils/pinecone-client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Get index
    const index = pinecone.Index(
      process.env.PINECONE_INDEX_NAME || 'test-index',
    );

    const requestType = req.body.type;

    if (requestType === 'delete-one') {
      await index.delete1({
        deleteAll: true,
        namespace: req.body.namespace,
      });
      return res.status(200).json({ result: true });
    } else {
      const indexStats = await index.describeIndexStats({
        describeIndexStatsRequest: {},
      });

      if (indexStats && !indexStats.namespaces) {
        throw new Error('No namespaces found');
      } else if (indexStats && indexStats.namespaces) {
        // Get array of namespaces
        const namespacesKeys = Object.keys(indexStats.namespaces);

        // Delete all namespaces
        await Promise.all(
          namespacesKeys.map(async (namespace) => {
            await index.delete1({
              deleteAll: true,
              namespace: namespace,
            });
          }),
        );

        return res.status(200).json({ result: true });
      }
    }
  } catch (error) {
    return res.status(500).json({ result: false, message: error });
  }
}

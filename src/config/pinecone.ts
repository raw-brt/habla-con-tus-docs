/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? 'test-index';

const PINECONE_NAME_SPACE = 'pdf-test-2'; //namespace is optional for your vectors

export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE };

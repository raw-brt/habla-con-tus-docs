import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { DirectoryLoader } from 'langchain/document_loaders';
import { pinecone } from '../utils/pinecone-client';
import { PINECONE_INDEX_NAME } from '../config/pinecone';
import { PdfLoader } from '../utils/pdfLoader';

/* Name of directory to retrieve your files from */
const filePath = 'docs';

export const run = async () => {
  try {
    /*load raw docs from docs directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new PdfLoader(path),
    });

    const rawDocs = await directoryLoader.load();

    // Get file names
    const fileNames = rawDocs.map((doc) => doc.metadata.source);

    // Extract file name from filenames path
    const fileNamesExtracted = fileNames.map((fileName) => {
      const fileNameExtracted = fileName.split("/").pop();
      return fileNameExtracted;
    });

    // Remove file extension from file names
    const fileNamesExtractedNoExtension = fileNamesExtracted.map((fileName) => {
      const fileNameExtractedNoExtension = fileName.split(".").shift();
      return fileNameExtractedNoExtension;
    });

    console.log("Documentos que se van a subir: ", fileNamesExtractedNoExtension);

    /* Text splitter*/
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.splitDocuments(rawDocs);

    console.log("Troceando ficheros...")

    docs.map(async (doc) => {

    // Get namespace from fileNamesExtractedNoExtension according to if doc.metadata.source includes it
    const namespace = fileNamesExtractedNoExtension.find((fileName) => {
      return doc.metadata.source.includes(fileName)
    })

      const embeddings = new OpenAIEmbeddings();
      const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

      await PineconeStore.fromDocuments([doc], embeddings, {
        pineconeIndex: pineconeIndex,
        namespace: namespace,
        textKey: 'text',
      });

    });
  } catch (error) {
    console.log('error', error);
    throw new Error('La carga de datos ha fallado. Por favor, inténtalo de nuevo.');
  }
};

(async () => {
  await run();
  console.log('Carga completa!');
})();

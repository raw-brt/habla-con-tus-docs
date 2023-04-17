import { Document } from 'langchain/document';
import { readFile } from 'fs/promises';
import { BaseDocumentLoader } from 'langchain/document_loaders';

export abstract class BufferLoader extends BaseDocumentLoader {
  constructor(public filePathOrBlob: string | Blob) {
    super();
  }

  protected abstract parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]>;

  private async getBufferAndMetadata(): Promise<{
    buffer: Buffer;
    metadata: Record<string, string>;
  }> {
    if (typeof this.filePathOrBlob === 'string') {
      const buffer = await readFile(this.filePathOrBlob);
      const metadata = { source: this.filePathOrBlob };
      return { buffer, metadata };
    } else {
      const buffer = await this.filePathOrBlob
        .arrayBuffer()
        .then((ab) => Buffer.from(ab));
      const metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
      return { buffer, metadata };
    }
  }

  public async load(): Promise<Document[]> {
    const { buffer, metadata } = await this.getBufferAndMetadata();
    return this.parse(buffer, metadata);
  }
}

export class PdfLoader extends BufferLoader {
  public async parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]> {
    const { pdf } = await PDFLoaderImports();
    const parsed = await pdf(raw);
    return [
      new Document({
        pageContent: parsed.text,
        metadata: {
          ...metadata,
          pdf_numpages: parsed.numpages,
        },
      }),
    ];
  }
}

async function PDFLoaderImports() {
  try {
    // the main entrypoint has some debug code that we don't want to import
    const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
    return { pdf };
  } catch (e) {
    console.error(e);
    throw new Error(
      'Failed to load pdf-parse. Please install it with eg. `npm install pdf-parse`.',
    );
  }
}
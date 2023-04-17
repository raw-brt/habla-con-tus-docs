import { OpenAIChat } from 'langchain/llms';
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from 'langchain/chains';
import { PineconeStore } from 'langchain/vectorstores';
import { PromptTemplate } from 'langchain/prompts';
import { CallbackManager } from 'langchain/callbacks';

const SYNTHETIZE_PROMPT = PromptTemplate.fromTemplate(`

  Dada la siguiente conversación y pregunta que viene a continuación, reformula la pregunta para que sea una pregunta independiente.

  Histórico del chat:
  {chat_history}
  Siguiente pregunta: {question}
  Pregunta independiente:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
`Eres un asistente de IA que brinda consejos útiles. Se te da lo siguiente: partes extraídas de un documento largo y una pregunta. Proporciona una respuesta conversacional basada en el contexto proporcionado.

Solo debes proporcionar enlaces hipertexto que hagan referencia al contexto a continuación. NO inventes enlaces en formato hipertexto.

Si se solicita un resumen, procederás a resumir el contenido del documento completo.

Si no puedes encontrar la respuesta en el contexto a continuación y no estás entrenada en base a contenido estrechamente relacionado con el contexto dado, solo diga "Hmm, no estoy seguro". No intentes inventar una respuesta.

Si la pregunta no está relacionada con el contexto, responde educadamente que estás configurada para responder solo a preguntas relacionadas con el contexto. Debes responder en español.

Pregunta: {question}
=========
{context}
=========
Respuesta en Markdown:`,
);

export const createChain = (
  vectorstore: PineconeStore,
  onTokenStream?: (token: string) => void,
) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0, modelName: 'gpt-3.5-turbo' }),
    prompt: SYNTHETIZE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0,
      modelName: 'gpt-3.5-turbo', // Change this to GPT-4 if you have access
      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
            async handleLLMNewToken(token) {
              onTokenStream(token);
            },
          })
        : undefined,
    }),
    { prompt: QA_PROMPT },
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 2, //number of source documents to return
  });
};

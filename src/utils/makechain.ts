import { OpenAIChat } from 'langchain/llms';
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from 'langchain/chains';
import { PineconeStore } from 'langchain/vectorstores';
import { PromptTemplate } from 'langchain/prompts';
import { CallbackManager } from 'langchain/callbacks';

const CONDENSE_PROMPT = PromptTemplate.fromTemplate(`

  Dada la siguiente conversación y pregunta que viene a continuación, reformula la pregunta para que sea una pregunta independiente.

  Histórico del chat:
  {chat_history}
  Siguiente pregunta: {question}
  Pregunta independiente:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
  `Eres un asistente de IA que brinda consejos útiles. Se te da lo siguiente: partes extraídas de un documento largo y una pregunta. Proporcione una respuesta conversacional basada en el contexto proporcionado.

Solo debe proporcionar enlaces hipertexto que hagan referencia al contexto a continuación. NO invente enlaces hipertexto.

Si no puede encontrar la respuesta en el contexto a continuación, solo diga "Hmm, no estoy seguro". No intente inventar una respuesta.

Si la pregunta no está relacionada con el contexto, responda educadamente que está ajustado para responder solo a preguntas relacionadas con el contexto. Debe responder en español.

Si se solicita un resumen, procederá a condensar el contexto a continuación y luego responderá la pregunta.

Pregunta: {question}
=========
{context}
=========
Respuesta en Markdown:`,
);

export const makeChain = (
  vectorstore: PineconeStore,
  onTokenStream?: (token: string) => void,
) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0,
      modelName: 'gpt-3.5-turbo', //change this to older versions (e.g. gpt-3.5-turbo) if you don't have access to gpt-4
      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
            async handleLLMNewToken(token) {
              onTokenStream(token);
              console.log(token);
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

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import styles from '@/src/styles/Home.module.css';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Document } from 'langchain/document';
import { Message } from '@/src/types/chat';
import { Sidebar } from '@/src/components/Sidebar';
import { Source } from '@/src/components/Source';
import LoadingDots from '@/src/components/ui/LoadingDots';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceDocs, setSourceDocs] = useState<Document[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: selectedNamespace ? `Hola! Pregúntame lo que quieras sobre el documento '${selectedNamespace}'` : "Aún no has subido ningún documento. Cuando lo hagas, podrás preguntarme lo que quieras sobre él.",
        type: 'apiMessage',
      },
    ],
    history: [],
    pendingSourceDocs: [],
  });

  const { messages, pending, history, pendingSourceDocs } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  // If selectedNamespace changes, update the welcome message and reset message history
  useEffect(() => {
    setMessageState({
      messages: [
        {
          message: selectedNamespace ? `Hola! Pregúntame lo que quieras sobre el documento '${selectedNamespace}'` : "Aún no has subido ningún documento. Cuando lo hagas, podrás preguntarme lo que quieras sobre él.",
          type: 'apiMessage',
        },
      ],
      history: [],
      pendingSourceDocs: [],
    });
  }, [selectedNamespace]);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      toast('Por favor, haz una pregunta');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
      pending: undefined,
    }));

    setLoading(true);
    setQuery('');
    setMessageState((state) => ({ ...state, pending: '' }));

    const ctrl = new AbortController();

    try {
      fetchEventSource('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
          selectedNamespace,
        }),
        signal: ctrl.signal,
        onmessage: (event) => {
          if (event.data === '[DONE]') {
            setMessageState((state) => ({
              history: [...state.history, [question, state.pending ?? '']],
              messages: [
                ...state.messages,
                {
                  type: 'apiMessage',
                  message: state.pending ?? '',
                  sourceDocs: state.pendingSourceDocs,
                },
              ],
              pending: undefined,
              pendingSourceDocs: undefined,
            }));
            setLoading(false);
            ctrl.abort();
          } else {
            const data = JSON.parse(event.data);
            if (data.sourceDocs) {
              setMessageState((state) => ({
                ...state,
                pendingSourceDocs: data.sourceDocs,
              }));
            } else {
              setMessageState((state) => ({
                ...state,
                pending: (state.pending ?? '') + data.data,
              }));
            }
          }
        },
      });
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  //prevent empty submissions
  const handleEnter = useCallback(
    (e: any) => {
      if (e.key === 'Enter' && query) {
        handleSubmit(e);
      } else if (e.key == 'Enter') {
        e.preventDefault();
      }
    },
    [query],
  );

  const chatMessages = useMemo(() => {
    return [
      ...messages,
      ...(pending
        ? [
            {
              type: 'apiMessage',
              message: pending,
              sourceDocs: pendingSourceDocs,
            },
          ]
        : []),
    ];
  }, [messages, pending, pendingSourceDocs]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <>
      <Layout>
        <div className="flex flex-col justify-start items-center">
          <h1 className="text-2xl font-bold text-center my-10">
            💬 Habla con tus docs 📑
          </h1>
          <main className="w-full h-full flex justify-center items-start space-x-4">
            <Sidebar
              selectedNamespace={selectedNamespace}
              setSelectedNamespace={setSelectedNamespace}
            />
            <div className="flex flex-col justify-between items-center w-auto max-w-4xl">
              <div className="w-full h-[65vh] bg-slate-50 rounded border border-slate-200 flex justify-center items-center">
                <div
                  ref={messageListRef}
                  className="w-full h-full overflow-y-auto rounded"
                >
                  {chatMessages.map((message, index) => {
                    let icon;
                    let className;
                    if (message.type === 'apiMessage') {
                      icon = (
                        <Image
                          src="/bot-image.png"
                          alt="AI"
                          width="40"
                          height="40"
                          className="mr-5 rounded-sm h-full"
                          priority
                        />
                      );
                      className =
                        'bg-slate-100 p-10 text-neutral-900 transition-all duration-300 ease-in-out flex justify-start items-center';
                    } else {
                      icon = (
                        <Image
                          src="/usericon.png"
                          alt="Me"
                          width="40"
                          height="40"
                          className="mr-5 rounded-sm h-full"
                          priority
                        />
                      );
                      // The latest message sent by the user will be animated while waiting for a response
                      className =
                        loading && index === chatMessages.length - 1
                          ? 'flex justify-start p-12 text-neutral-900 bg-slate-100 flex justify-start items-center animate-pulse w-full'
                          : 'bg-slate-50 p-12 text-neutral-900 flex justify-start items-center';
                    }
                    return (
                      <>
                        <div key={`chatMessage-${index}`} className={className}>
                          {icon}
                          <div className={styles.markdownanswer}>
                            <ReactMarkdown linkTarget="_blank">
                              {message.message}
                            </ReactMarkdown>
                          </div>
                        </div>
                        {message.sourceDocs && (
                          <div
                            className="p-5"
                            key={`sourceDocsAccordion-${index}`}
                          >
                            <Accordion
                              type="single"
                              collapsible
                              className="flex-col"
                            >
                              {message.sourceDocs.map((doc, index) => (
                                <div key={`messageSourceDocs-${index}`}>
                                  <AccordionItem value={`item-${index}`}>
                                    <AccordionTrigger>
                                      <h3>Fuente {index + 1}</h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <ReactMarkdown linkTarget="_blank">
                                        {doc.pageContent}
                                      </ReactMarkdown>
                                      <p className="mt-2">
                                        <b>Fuente:</b> {doc.metadata.source}
                                      </p>
                                    </AccordionContent>
                                  </AccordionItem>
                                </div>
                              ))}
                            </Accordion>
                          </div>
                        )}
                      </>
                    );
                  })}
                  {sourceDocs.length > 0 && <Source sourceDocs={sourceDocs} />}
                </div>
              </div>
              <div className="flex flex-col justify-center items-center relative py-10 max-w-4xl">
                <div className="relative">
                  <form onSubmit={handleSubmit}>
                    <textarea
                      disabled={loading || !selectedNamespace}
                      onKeyDown={handleEnter}
                      ref={textAreaRef}
                      autoFocus={false}
                      rows={1}
                      maxLength={512}
                      id="userInput"
                      name="userInput"
                      placeholder={
                        loading
                          ? 'Esperando la respuesta...'
                          : 'Pregunta algo sobre tu documento'
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="relative resize-none text-xl py-5 px-10 w-[65vw] rounded-lg border bg-slate-50 text-neutral-900 outline-none disabled:opacity-50 focus:ring-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="absolute top-[1.3rem] right-[1rem] text-slate-400 hover:text-slate-600 bg-transparent p-[0.3rem] border-none flex disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="absolute top-[0.2rem] right-[0.25rem]">
                          <LoadingDots color="#000" />
                        </div>
                      ) : (
                        // Send icon SVG in input field
                        <svg
                          viewBox="0 0 20 20"
                          className="rotate-90 w-[1.2rem] h-[1.2rem] fill-inherit"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              </div>
              {error && (
                <div className="border border-red-400 rounded-md p-4">
                  <p className="text-red-500">{error}</p>
                </div>
              )}
            </div>
          </main>
        </div>
        <footer className="m-auto p-4">
          <a href="https://twitter.com/_rbart_">
            Hecho con LangChainAI, OpenAI and Pinecone. Producto construido por Roberto
            Díaz (Twitter: @_rbart_).
          </a>
        </footer>
      </Layout>
    </>
  );
}

import { FC, useEffect } from 'react';
import { fetcher } from '../utils/fetcher';
import clsx from 'clsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import LoadingDots from './ui/LoadingDots';

interface Props {
  selectedNamespace: string | null;
  setSelectedNamespace: (namespace: string | null) => void;
}

export const Sidebar: FC<Props> = ({
  selectedNamespace,
  setSelectedNamespace,
}) => {
  const queryClient = useQueryClient();

  const getNamespaces = useQuery(
    ['namespaces'],
    async () => {
      const response = await fetcher('/api/namespaces');
      return response;
    },
    {
      onSuccess: (data) => {
        if (data.length > 0 || selectedNamespace === null) {
          setSelectedNamespace(data[0]);
        }
      },
    },
  );

  const deleteAllNamespaces = useMutation(
    async () => {
      const response = await fetcher('/api/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestType: 'all' }),
      });

      if (response.error || response.result === false) {
        throw new Error();
      } else {
        // Return response ordered alphabetically
        response.result.sort((a: string, b: string) => {
          if (a < b) {
            return -1;
          } else if (a > b) {
            return 1;
          } else {
            return 0;
          }
        });

        console.log("response", response)

        return response;
      }
    },
    {
      onSuccess: (data) => {
        console.log("data", data)
        if (data.result) {
          queryClient.invalidateQueries(['namespaces']);
          setSelectedNamespace(null);
        }
      },
    },
  );

  const handleClear = () => {
    try {
      deleteAllNamespaces.mutate();
      toast.success('Documentos borrados con éxito.');
    } catch (error) {
      toast.error(
        'Ha habido un error al borrar los documentos. Si el error persiste, ponte en contacto con Roberto!',
      );
      console.log(error);
    }
  };

  if (getNamespaces.isLoading)
    return (
      <div className="flex flex-col justify-center items-center max-w-4xl bg-slate-50 border rounded h-[65vh] w-64">
        <p className="text-neutral-700 font-bold text-center">
          Cargando
          <span><LoadingDots /></span>
        </p>
      </div>
    );

  if (!getNamespaces || !getNamespaces.data) return null;

  if (getNamespaces && getNamespaces.data.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center max-w-4xl bg-slate-50 border rounded h-[65vh] w-64">
        <p className="text-neutral-700 font-bold text-center">
          No has subido archivos aún
        </p>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col justify-start items-start bg-slate-50 border rounded h-[65vh] w-64 relative overflow-y-auto">
        {getNamespaces.data.map((namespace: string, index: number) => (
          <div
            key={index}
            className={clsx(
              selectedNamespace === namespace
                ? 'flex justify-start items-center h-20 w-full border-b space-x-4 group cursor-pointer bg-slate-200'
                : 'flex justify-start items-center h-20 w-full border-b space-x-4 group cursor-pointer hover:bg-slate-200',
            )}
            onClick={() => setSelectedNamespace(namespace)}
          >
            <div className="w-10 h-10 rounded-full border-2 border-slate-500 ml-2 flex justify-center items-center">
              <p className="text-center group-hover:font-bold">
                {namespace ? namespace[0].toUpperCase() : null}
              </p>
            </div>
            <p>
              {namespace.length > 10
                ? namespace.slice(0, 10) + '...'
                : namespace.slice()}
            </p>
          </div>
        ))}
        <button
          className="absolute bottom-0 left-0 w-full h-12 bg-slate-400 hover:bg-slate-500 text-white font-bold"
          onClick={() => handleClear()}
        >
          Eliminar documentos
        </button>
      </div>
    );
  }
};

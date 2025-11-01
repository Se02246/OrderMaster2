import { QueryClient, QueryFunction } from "@tanstack/react-query";

export const queryClient = new QueryClient();

/**
 * Gestore centralizzato degli errori per le risposte fetch.
 * Lancia un errore se la risposta non è "ok".
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    const message = data.message || res.statusText;

    // Logica di reindirizzamento 401 rimossa da qui per prevenire loop.
    // Sarà gestita dall'onError di useQuery in AuthContext.
    
    throw new Error(`${res.status}: ${message}`);
  }
}

/**
 * Funzione generica per le query (GET) usata da useQuery.
 */
export const getQueryFn: QueryFunction = async ({ queryKey }) => {
  const res = await fetch(queryKey.join("/"));
  await throwIfResNotOk(res);
  return res.json();
};

/**
 * Funzione helper per richieste API (POST, PUT, DELETE) usata da useMutation.
 * Questa era la funzione mancante che causava l'errore di build.
 */
export async function apiRequest<T>(
  method: "POST" | "PUT" | "DELETE",
  url: string,
  body?: unknown
): Promise<T> {
  
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  await throwIfResNotOk(res);

  // Gestisce risposte senza corpo (es. 204 No Content per DELETE)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null as T;
  }

  return res.json();
}

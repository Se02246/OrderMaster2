import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
 * === DEVE ESSERE DICHIARATA PRIMA DI queryClient ===
 */
export const getQueryFn: QueryFunction = async ({ queryKey }) => {
  // === INIZIO MODIFICA ===
  // queryKey[0] è l'URL base (es. "/api/apartments")
  // queryKey[1] (se esiste) è un oggetto di parametri (es. { sortBy: "name" })

  const baseUrl = queryKey[0] as string;
  const params = queryKey[1] as Record<string, string> | undefined;

  // Costruiamo l'URL in modo sicuro, aggiungendo i parametri di ricerca
  const url = new URL(baseUrl, window.location.origin);
  if (params) {
    Object.keys(params).forEach((key) => {
      // Aggiungi il parametro solo se ha un valore
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        url.searchParams.append(key, params[key]);
      }
    });
  }

  // La vecchia versione (queryKey.join('/')) non funzionava con oggetti
  const res = await fetch(url.toString());
  // === FINE MODIFICA ===

  await throwIfResNotOk(res);
  return res.json();
};

// === MODIFICA CHIAVE ===
// queryClient viene ora dichiarato DOPO getQueryFn
// e la imposta come "queryFn" predefinita per l'intera app.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn,
    },
  },
});
// === FINE MODIFICA ===

/**
 * Funzione helper per richieste API (POST, PUT, DELETE) usata da useMutation.
 * Questa funzione restituisce GIÀ il JSON, non la risposta grezza.
 */
export async function apiRequest<T>(
  method: "POST" | "PUT" | "DELETE",
  url: string,
  body?: unknown,
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

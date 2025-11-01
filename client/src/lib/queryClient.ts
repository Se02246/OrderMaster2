async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    const message = data.message || res.statusText;
    
    // === INIZIO MODIFICA ===
    // Rimuoviamo la logica di reindirizzamento da qui.
    // Lasciamo che sia il gestore onError di useQuery in AuthContext
    // a gestire il reindirizzamento 401.
    // Questo interrompe il loop di ricaricamento sulla pagina di login.
    /*
    if (res.status === 401) {
      queryClient.clear();
      window.location.href = '/login'; 
      throw new Error("Sessione scaduta. Reindirizzamento al login...");
    }
    */
    // === FINE MODIFICA ===
    
    throw new Error(`${res.status}: ${message}`);
  }
}

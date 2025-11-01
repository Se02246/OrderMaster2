// ... altre importazioni ...
  
  // ...
  // const user = data || null;

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      
      // === INIZIO MODIFICA ===
      // 1. Naviga prima alla pagina di login.
      // Questo smonta i componenti delle pagine protette (es. Home).
      navigate("/login");
      
      // 2. Pulisci la cache DOPO la navigazione.
      // Questo impedisce alle query delle vecchie pagine di
      // rieseguire e fallire con 401.
      queryClient.clear();
      // === FINE MODIFICA ===

      toast({ title: "Logout", description: "Sei stato disconnesso." });
    } catch (error: any) {
      toast({
        title: "Errore Logout",
        description: error.message || "Impossibile effettuare il logout.",
        variant: "destructive",
      });
    }
  };

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      error,
      logout, 
    }),
    [user, isLoading, error] 
  );
  
  // ... resto del file ...

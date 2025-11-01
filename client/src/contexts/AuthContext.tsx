import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SafeUser } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SafeUser | null;
  isLoading: boolean;
  error: Error | null;
  logout: () => void; // Aggiunto
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<SafeUser>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn,
    retry: 1,

    onSuccess: (user) => {
      // Quando i dati dell'utente vengono caricati con successo
      if (user && user.theme_color) {
        // 1. Applica il colore dal database
        document.documentElement.style.setProperty(
          "--primary",
          user.theme_color
        );
        // 2. Salvalo nel localStorage per ricaricamenti futuri (evita flash di colore)
        localStorage.setItem("themeColor", user.theme_color);
      }
    },

    onError: () => {
      // Se c'è un errore (es. token non valido), reindirizza al login
      if (window.location.pathname !== "/login") {
        navigate("/login");
      }
    },
  });

  const user = data || null;

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      
      // 1. Naviga prima alla pagina di login.
      navigate("/login");
      
      // 2. Pulisci la cache DOPO la navigazione.
      queryClient.clear();

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
      logout, // Aggiunto
    }),
    [user, isLoading, error] // logout rimosso dalle dipendenze, non serve
  );

  // Non mostrare l'app finché non sappiamo se l'utente è loggato
  // Tranne per la pagina di login
  if (isLoading && window.location.pathname !== "/login") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// === INIZIO MODIFICA ===
// Questa è la parte che mancava nell'aggiornamento precedente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
// === FINE MODIFICA ===

import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SafeUser } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import React, { createContext, useContext, useMemo } from "react";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SafeUser | null;
  isLoading: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<SafeUser>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn,
    retry: 1,
    
    // === INIZIO MODIFICA ===
    onSuccess: (user) => {
      if (user && user.theme_color) {
        // Applica il colore dal database
        document.documentElement.style.setProperty('--primary', user.theme_color);
        // Salva nel localStorage per il prossimo caricamento (più veloce)
        localStorage.setItem("themeColor", user.theme_color);
      }
    },
    // === FINE MODIFICA ===
    
    onError: () => {
      // Se c'è un errore (es. token non valido), reindirizza al login
      if (window.location.pathname !== "/login") {
        navigate("/login");
      }
    },
  });

  const user = data || null;

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      error,
    }),
    [user, isLoading, error]
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient"; // Modificato
import { SafeUser } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Modificato
import React, { createContext, useContext, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast"; // Aggiunto

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
  const queryClient = useQueryClient(); // Aggiunto
  const { toast } = useToast(); // Aggiunto

  const { data, isLoading, error } = useQuery<SafeUser>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn,
    retry: 1,
    
    onSuccess: (user) => {
      if (user && user.theme_color) {
        document.documentElement.style.setProperty('--primary', user.theme_color);
        localStorage.setItem("themeColor", user.theme_color);
      }
    },
    
    onError: () => {
      if (window.location.pathname !== "/login") {
        navigate("/login");
      }
    },
  });

  const user = data || null;

  // === INIZIO MODIFICA: Aggiunta funzione Logout ===
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      // Pulisci la cache di react-query per rimuovere i dati utente
      queryClient.clear();
      // Reindirizza alla pagina di login
      navigate("/login");
      toast({ title: "Logout", description: "Sei stato disconnesso." });
    } catch (error: any) {
      toast({
        title: "Errore Logout",
        description: error.message || "Impossibile effettuare il logout.",
        variant: "destructive",
      });
    }
  };
  // === FINE MODIFICA ===

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      error,
      logout, // Aggiunto
    }),
    [user, isLoading, error] // Rimosso 'logout' dalle dipendenze, gestito da useMemo
  );

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
  // Adesso 'context' include la funzione 'logout'
  return context; 
};

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SafeUser | null;
  isLoading: boolean;
  login: (user: SafeUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUser(): Promise<SafeUser | null> {
  try {
    const res = await apiRequest("GET", "/api/auth/me");
    return await res.json();
  } catch (error: any) {
    if (error.message.startsWith('401')) {
      console.log("Nessun utente loggato.");
    } else {
      console.error("Errore nel fetchUser:", error.message);
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: fetchUser,
    staleTime: Infinity, // I dati dell'utente sono considerati stabili
    retry: false, // Non tentare di nuovo se fallisce (significa solo che non è loggato)
    refetchOnWindowFocus: true, // Ricontrolla se l'utente è ancora loggato
  });

  const login = (loggedInUser: SafeUser) => {
    // Aggiorna la cache di /api/auth/me per evitare una chiamata inutile
    queryClient.setQueryData(["/api/auth/me"], loggedInUser);
    setLocation("/"); // Reindirizza alla home
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Errore durante il logout:", error);
    } finally {
      // Invalida tutte le query e resetta la cache
      queryClient.clear();
      // Assicura che anche la query /api/auth/me sia pulita
      queryClient.setQueryData(["/api/auth/me"], null);
      setLocation("/login"); // Reindirizza al login
    }
  };

  const value = {
    user: user || null,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

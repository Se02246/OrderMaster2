import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// useAuth non viene più usato qui per una funzione 'login'
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SafeUser } from "@shared/schema";

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "La password è obbligatoria"),
});

const registerSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  // const { login } = useAuth(); // Rimosso: la funzione login non esiste in AuthContext
  const { toast } = useToast();
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [isRegisterPending, setIsRegisterPending] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoginPending(true);
    try {
      // === INIZIO MODIFICA ===
      // 1. apiRequest ora restituisce direttamente i dati JSON (l'utente)
      // Rimuoviamo la chiamata .json()
      const user = await apiRequest<SafeUser>("POST", "/api/auth/login", data);
      
      // 2. AuthContext non ha una funzione 'login'.
      // La chiamata API imposta il cookie di sessione.
      // Dobbiamo solo reindirizzare alla home.
      window.location.href = "/"; 
      // === FINE MODIFICA ===

      toast({ title: "Accesso effettuato", description: `Bentornato, ${user.email}!` });
    } catch (error: any) {
      toast({
        title: "Errore di accesso",
        description: error.message || "Credenziali errate.",
        variant: "destructive",
      });
    }
    setIsLoginPending(false);
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsRegisterPending(true);
    try {
      // === INIZIO MODIFICA ===
      // 1. apiRequest ora restituisce direttamente i dati JSON (l'utente)
      const user = await apiRequest<SafeUser>("POST", "/api/auth/register", data);
      
      // 2. Reindirizziamo alla home. AuthContext gestirà il fetch dell'utente
      // al caricamento della pagina.
      window.location.href = "/";
      // === FINE MODIFICA ===

      toast({ title: "Registrazione completata", description: `Benvenuto, ${user.email}!` });
    } catch (error: any) {
      toast({
        title: "Errore di registrazione",
        description: error.message || "Impossibile registrarsi. L'email potrebbe essere già in uso.",
        variant: "destructive",
      });
    }
    setIsRegisterPending(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Accedi</TabsTrigger>
          <TabsTrigger value="register">Registrati</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Accedi al tuo account</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="tua@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoginPending}>
                    {isLoginPending ? "Accesso in corso..." : "Accedi"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Crea un nuovo account</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="tua@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Min. 6 caratteri" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isRegisterPending}>
                    {isRegisterPending ? "Registrazione..." : "Registrati"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

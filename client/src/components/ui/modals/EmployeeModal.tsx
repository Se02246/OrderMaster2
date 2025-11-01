import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Employee, insertEmployeeSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ModalProps } from "./types";

type EmployeeModalProps = ModalProps<Employee>;

// Usiamo insertEmployeeSchema per validare il form (omettendo id e user_id)
const formSchema = insertEmployeeSchema.omit({ id: true, user_id: true });
type EmployeeFormValues = z.infer<typeof formSchema>;

export function EmployeeModal({ isOpen, onClose, data }: EmployeeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!data; // Al momento la modifica non è implementata, ma la logica è qui

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode
      ? data
      : { first_name: "", last_name: "", phone: "" },
  });

  // Reset del form quando 'data' cambia
  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        isEditMode
          ? data
          : { first_name: "", last_name: "", phone: "" }
      );
    }
  }, [isOpen, data, isEditMode, form]);


  const mutation = useMutation({
    mutationFn: (employeeData: EmployeeFormValues) => {
      // NOTA: la logica di modifica (PUT) non è richiesta per ora,
      // quindi gestiamo solo la creazione (POST)
      if (isEditMode) {
        // Logica PUT (non implementata nel backend in questo modal)
        // return apiRequest("PUT", `/api/employees/${data.id}`, employeeData);
        throw new Error("La modifica non è ancora supportata da questo modal.");
      } else {
        // Logica POST
        return apiRequest("POST", "/api/employees", employeeData);
      }
    },
    onSuccess: (res) => {
      // === INIZIO MODIFICA ===
      // 'res' è GIA' l'oggetto JSON, non la risposta fetch.
      // Rimuoviamo (await res.json())
      const newEmployee = res as Employee;
      // === FINE MODIFICA ===

      toast({
        title: isEditMode ? "Dipendente aggiornato" : "Dipendente creato",
        description: `${newEmployee.first_name} ${newEmployee.last_name} è stato salvato.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare il dipendente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifica Dipendente" : "Nuovo Dipendente"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Mario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cognome</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Rossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono (opzionale)</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. 333 1234567" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvataggio..." : "Salva Dipendente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

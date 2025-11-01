import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// === INIZIO MODIFICA ===
// Importiamo 'apartmentWithEmployeesSchema' invece di 'apartmentSchema'
import { Apartment, Employee, apartmentWithEmployeesSchema } from "@shared/schema";
// === FINE MODIFICA ===
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModalProps } from "./types";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type ApartmentModalProps = ModalProps<Apartment>;

// === INIZIO MODIFICA ===
// Usiamo direttamente lo schema importato
const formSchema = apartmentWithEmployeesSchema;
// === FINE MODIFICA ===
type ApartmentFormValues = z.infer<typeof formSchema>;

export function ApartmentModal({ isOpen, onClose, data }: ApartmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!data;

  // Carica l'elenco dei dipendenti da mostrare nelle checkbox
  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: getQueryFn,
    enabled: isOpen, // Carica solo quando il modal è aperto
  });

  const form = useForm<ApartmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode
      ? {
          ...data,
          employee_ids: data.employees?.map(e => e.id) || [],
        }
      : {
          name: "",
          address: "",
          cleaning_date: new Date(),
          notes: "",
          employee_ids: [],
        },
  });

  // Reset del form quando 'data' cambia (es. apertura modal)
  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        isEditMode
          ? { ...data, employee_ids: data.employees?.map(e => e.id) || [] }
          : {
              name: "",
              address: "",
              cleaning_date: new Date(),
              notes: "",
              employee_ids: [],
            }
      );
    }
  }, [isOpen, data, isEditMode, form]);

  const mutation = useMutation({
    mutationFn: (apartmentData: ApartmentFormValues) => {
      const url = isEditMode ? `/api/apartments/${data.id}` : "/api/apartments";
      const method = isEditMode ? "PUT" : "POST";
      return apiRequest(method, url, apartmentData);
    },
    onSuccess: (res) => {
      // 'res' è GIA' l'oggetto JSON (correzione precedente)
      const newApartment = res as Apartment;

      toast({
        title: isEditMode ? "Ordine aggiornato" : "Ordine creato",
        description: `L'ordine per ${newApartment.name} è stato salvato.`,
      });
      // Invalida le query per ricaricare i dati freschi
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare l'ordine.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (formData: ApartmentFormValues) => {
    // Trasforma la data in stringa YYYY-MM-DD
    const processedData = {
      ...formData,
      cleaning_date: format(new Date(formData.cleaning_date), "yyyy-MM-dd"),
    };
    mutation.mutate(processedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifica Ordine" : "Nuovo Ordine"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Mario Rossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ...tutti gli altri FormField rimangono invariati... */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Via Roma, 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cleaning_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Pulizia</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: it })
                          ) : (
                            <span>Scegli una data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                        locale={it}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Es. Citofono 'Rossi', portare prodotto specifico per parquet."
                      className="resize-none"
                      {...field}
                      value={field.value || ""} // Assicura che non sia null
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="employee_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Dipendenti Assegnati</FormLabel>
                  <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                    {isLoadingEmployees ? (
                      <p>Caricamento dipendenti...</p>
                    ) : (
                      employees?.map((employee) => (
                        <FormField
                          key={employee.id}
                          control={form.control}
                          name="employee_ids"
                          render={({ field }) => (
                            <FormItem
                              key={employee.id}
                              className="flex flex-row items-start space-x-3 space-y-0 mb-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(employee.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), employee.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== employee.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {employee.first_name} {employee.last_name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                    {!isLoadingEmployees && !employees?.length && (
                      <p className="text-sm text-muted-foreground">Nessun dipendente trovato. Creane uno nella sezione 'Dipendenti'.</p>
                    )}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvataggio..." : "Salva Ordine"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from "react"; // Assicurati che React sia importato
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  type ApartmentWithAssignedEmployees,
  type Employee,
  apartmentWithEmployeesSchema,
} from "@shared/schema";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { type ModalProps } from "./types";
import { EmployeeModal } from "./EmployeeModal";

type FormValues = z.infer<typeof apartmentWithEmployeesSchema>;

type ApartmentModalProps = ModalProps<ApartmentWithAssignedEmployees>;

export function ApartmentModal({
  mode,
  data: apartment,
  isOpen,
  onClose,
}: ApartmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  // Carica i dipendenti per la selezione
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Setup del form
  const form = useForm<FormValues>({
    resolver: zodResolver(apartmentWithEmployeesSchema),
    defaultValues: {
      name: apartment?.name ?? "",
      cleaning_date: apartment?.cleaning_date ?? format(new Date(), "yyyy-MM-dd"),
      start_time: apartment?.start_time ?? "",
      status: apartment?.status ?? "Da Fare",
      payment_status: apartment?.payment_status ?? "Da Pagare",
      price: apartment?.price ?? "",
      notes: apartment?.notes ?? "",
      employee_ids: apartment?.employees.map((e) => e.id) ?? [],
    },
  });

  // Resetta il form quando i dati o la modalità cambiano
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: apartment?.name ?? "",
        cleaning_date: apartment?.cleaning_date ?? format(new Date(), "yyyy-MM-dd"),
        start_time: apartment?.start_time ?? "",
        status: apartment?.status ?? "Da Fare",
        payment_status: apartment?.payment_status ?? "Da Pagare",
        price: apartment?.price ?? "",
        notes: apartment?.notes ?? "",
        employee_ids: apartment?.employees.map((e) => e.id) ?? [],
      });
    }
  }, [isOpen, apartment, form]);
  
  // Mutazione per creare/aggiornare l'appartamento
  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const url =
        mode === "edit" ? `/api/apartments/${apartment!.id}` : "/api/apartments";
      const method = mode === "edit" ? "PUT" : "POST";
      return apiRequest(method, url, values);
    },
    onSuccess: () => {
      toast({
        title: `Ordine ${mode === "edit" ? "aggiornato" : "creato"}`,
        description: `L'ordine è stato ${
          mode === "edit" ? "aggiornato" : "creato"
        } con successo.`,
      });
      // Invalida tutte le query relative per aggiornare l'interfaccia
      queryClient.invalidateQueries({ queryKey: ["/api/apartments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  const onEmployeeCreated = () => {
    // Aggiorna l'elenco dei dipendenti
    queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    setIsEmployeeModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Modifica Ordine" : "Nuovo Ordine"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            {/* Il form inizia qui */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto px-1">
              {/* Sezione Dati Principali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Ordine</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Appartamento 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prezzo</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Es. 50.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sezione Data e Ora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cleaning_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Data Pulizia</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"

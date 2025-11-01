import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, UserPlus, Search } from "lucide-react";
import { ApartmentModalProps, ApartmentFormData, EmployeeFormData } from "./types";
import EmployeeModal from "./EmployeeModal";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  cleaning_date: z.string().min(1, "La data è obbligatoria"),
  start_time: z.string().optional(),
  status: z.enum(["Da Fare", "In Corso", "Fatto"]),
  payment_status: z.enum(["Da Pagare", "Pagato"]),
  notes: z.string().optional(),
  employee_ids: z.array(z.number()),
  price: z.coerce.number().min(0, "Il prezzo non può essere negativo").optional(),
});

export default function ApartmentModal({ isOpen, onClose, onSubmit, apartment, employees }: ApartmentModalProps) {
  const isEditing = !!apartment;
  const { toast } = useToast();
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeFormData) =>
      apiRequest('POST', '/api/employees', data),
    onSuccess: (newEmployee) => {
      queryClient.invalidateQueries();
      toast({
        title: "Successo",
        description: "Cliente creato con successo",
      });
      setIsEmployeeModalOpen(false);
      // Add the new employee to the selection
      const currentEmployeeIds = form.getValues("employee_ids");
      form.setValue("employee_ids", [...currentEmployeeIds, newEmployee.id]);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Errore durante la creazione: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Initialize form
  const form = useForm<ApartmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: apartment?.name || "",
      cleaning_date: apartment?.cleaning_date || "",
      start_time: apartment?.start_time || "",
      status: apartment?.status || "Da Fare",
      payment_status: apartment?.payment_status || "Da Pagare",
      notes: apartment?.notes || "",
      employee_ids: apartment?.employees.map(e => e.id) || [],
      price: apartment?.price ? Number(apartment.price) : 0,
    }
  });

  // Reset form when apartment changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: apartment?.name || "",
        cleaning_date: apartment?.cleaning_date || "",
        start_time: apartment?.start_time || "",
        status: apartment?.status || "Da Fare",
        payment_status: apartment?.payment_status || "Da Pagare",
        notes: apartment?.notes || "",
        employee_ids: apartment?.employees.map(e => e.id) || [],
        price: apartment?.price ? Number(apartment.price) : 0,
      });
    }
  }, [isOpen, apartment, form.reset]);

  const handleEmployeeSubmit = (data: EmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-dark">
                {isEditing ? "Modifica Ordine" : "Aggiungi Ordine"}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Nome Ordine</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cleaning_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Data</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Ora</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          />
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
                        <FormLabel className="text-sm font-medium text-gray-700">Prezzo (€)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="Es. 50.00"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Stato</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona uno stato" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Da Fare">Da Fare</SelectItem>
                            <SelectItem value="In Corso">In Corso</SelectItem>
                            <SelectItem value="Fatto">Fatto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Pagamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona stato pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Da Pagare">Da Pagare</SelectItem>
                            <SelectItem value="Pagato">Pagato</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="employee_ids"
                  render={() => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel className="text-sm font-medium text-gray-700">Clienti</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEmployeeModalOpen(true)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Nuovo Cliente
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          type="search"
                          placeholder="Cerca cliente..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      </div>
                      <div className="border border-gray-300 rounded-lg p-3 mt-2 max-h-36 overflow-y-auto">
                        {filteredEmployees.map((employee) => (
                          <FormField
                            key={employee.id}
                            control={form.control}
                            name="employee_ids"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={employee.id}
                                  className="flex items-center mb-2 last:mb-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(employee.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, employee.id])
                                          : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== employee.id
                                            )
                                          )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="ml-2 text-sm text-gray-700">
                                    {employee.first_name} {employee.last_name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Note</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-8 flex justify-end space-x-3">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    ANNULLA
                  </Button>
                  <Button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground font-medium"
                  >
                    {isEditing ? "SALVA" : "CREA"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSubmit={handleEmployeeSubmit}
      />
    </>
  );
}

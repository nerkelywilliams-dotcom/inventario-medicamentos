import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicationSchema, type InsertMedication, type Medication } from "@shared/schema";
import { useFamilies } from "@/hooks/use-families";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { z } from "zod";

interface MedicationFormProps {
  defaultValues?: Partial<InsertMedication>;
  onSubmit: (data: InsertMedication) => Promise<void>;
  isLoading: boolean;
  submitLabel: string;
}

// Extend schema to handle form inputs which come as strings
const formSchema = insertMedicationSchema.extend({
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa"),
  familyId: z.coerce.number().optional(),
  expirationDate: z.coerce.date(),
});

export function MedicationForm({ defaultValues, onSubmit, isLoading, submitLabel }: MedicationFormProps) {
  const { data: families } = useFamilies();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      presentation: "",
      quantity: 0,
      description: "",
      mechanismOfAction: "",
      indications: "",
      posology: "",
      administrationRoute: "",
      ...defaultValues,
      // Format date for input type="date"
      expirationDate: defaultValues?.expirationDate 
        ? new Date(defaultValues.expirationDate).toISOString().split('T')[0] as any
        : undefined,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Comercial</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Paracetamol" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="presentation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presentación</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Caja 500mg x 10 tabletas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="familyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Familia</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar familia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {families?.map((family) => (
                      <SelectItem key={family.id} value={family.id.toString()}>
                        {family.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha Vencimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ? String(field.value) : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-lg text-foreground/80">Ficha Técnica</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
              control={form.control}
              name="administrationRoute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vía de Administración</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Oral, Intravenosa" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Imagen (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="mechanismOfAction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mecanismo de Acción</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descripción del mecanismo..." className="resize-none" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="indications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indicaciones</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Usos terapéuticos..." className="resize-none" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="posology"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posología</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Dosis recomendada..." className="resize-none" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

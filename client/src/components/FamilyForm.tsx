import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFamilySchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface FamilyFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  initialData?: any; // Prop agregada para recibir los datos al editar
}

export function FamilyForm({ onSubmit, isLoading, initialData }: FamilyFormProps) {
  // Configuración del formulario
  const form = useForm({
    resolver: zodResolver(insertFamilySchema),
    defaultValues: initialData || {
      name: "",
      description: "",
    },
  });

  // EFECTO CLAVE: Sincroniza los datos cuando el componente recibe initialData
  // Esto hace que los campos dejen de aparecer en blanco al editar
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  // Función intermedia para manejar el envío
  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    // Solo reseteamos a vacío si no estamos editando (opcional, según prefieras)
    if (!initialData) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#1a2b4b] font-bold">Nombre de la Familia</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Antibióticos, Analgésicos..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#1a2b4b] font-bold">Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe el uso o grupo terapéutico..." 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full font-bold" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            initialData ? "Guardar Cambios" : "Guardar Familia"
          )}
        </Button>
      </form>
    </Form>
  );
}

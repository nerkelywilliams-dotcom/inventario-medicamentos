import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; // Agregado para validación
import { insertFamilySchema } from "@shared/schema"; // Agregado para usar el esquema del servidor
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

export function FamilyForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  // Configuración del formulario con validación automática de Zod
  const form = useForm({
    resolver: zodResolver(insertFamilySchema), // Vinculamos las reglas de la base de datos
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Función intermedia para limpiar el formulario tras un envío exitoso
  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    form.reset(); // Limpia los campos después de guardar
  };

  return (
    <Form {...form}>
      {/* Usamos nuestra función handleSubmit local */}
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
              <FormMessage /> {/* Esto ahora mostrará errores de Zod automáticamente */}
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
                  value={field.value || ""} // Evita errores de componentes controlados
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
            "Guardar Familia"
          )}
        </Button>
      </form>
    </Form>
  );
}
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicationSchema, type InsertMedication } from "@shared/schema";
import { useFamilies } from "@/hooks/use-families";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, PlusCircle, X } from "lucide-react";
import { z } from "zod";

interface MedicationFormProps {
  defaultValues?: Partial<InsertMedication>;
  onSubmit: (data: InsertMedication) => Promise<void>;
  isLoading: boolean;
  submitLabel: string;
}

// Opciones para los menús
const PRESENTACIONES = ["Tableta", "Cápsula", "Comprimido", "Suspensión", "Jarabe", "Crema", "Gel", "Ampolla", "Vial"];
const VIAS_ADMIN = ["Oral", "Tópica", "Intravaginal", "Rectal", "Intravenosa", "Intramuscular", "Subcutánea", "Oftálmica"];

// Extendemos el esquema para incluir 'dose' y manejar los tipos de entrada
const formSchema = insertMedicationSchema.extend({
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa"),
  familyId: z.coerce.number().optional(),
  expirationDate: z.coerce.date(),
  dose: z.string().min(1, "La dosis es requerida"), // Nuevo campo
  imageUrl: z.union([
    z.instanceof(File),
    z.string(),
    z.null(),
  ]).optional(),
});

export function MedicationForm({ defaultValues, onSubmit, isLoading, submitLabel }: MedicationFormProps) {
  const { data: families } = useFamilies();
  
  // Estados para controlar si el usuario escribe una opción nueva
  const [isCustomPresentation, setIsCustomPresentation] = useState(false);
  const [isCustomVia, setIsCustomVia] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      presentation: "",
      dose: "",
      quantity: 0,
      description: "",
      mechanismOfAction: "",
      indications: "",
      posology: "",
      administrationRoute: "",
      ...defaultValues,
      expirationDate: defaultValues?.expirationDate 
        ? new Date(defaultValues.expirationDate).toISOString().split('T')[0] as any
        : undefined,
    },
  });

  const handleSubmit = (data: any) => {
    const file = data.imageUrl;
    if (file instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const finalData = { ...data, imageUrl: reader.result as string };
        onSubmit(finalData);
      };
      reader.readAsDataURL(file);
    } else {
      onSubmit(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nombre Comercial</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Paracetamol" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* PRESENTACIÓN CON MENÚ INTELIGENTE */}
          <FormField
            control={form.control}
            name="presentation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presentación</FormLabel>
                {isCustomPresentation ? (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <FormControl>
                      <Input placeholder="Escribe presentación..." {...field} autoFocus />
                    </FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setIsCustomPresentation(false)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <Select 
                    onValueChange={(val) => val === "OTHER" ? setIsCustomPresentation(true) : field.onChange(val)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRESENTACIONES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      <SelectItem value="OTHER" className="font-bold text-primary">
                        <PlusCircle className="mr-2 h-4 w-4 inline" /> Crear nueva...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* NUEVO CAMPO: DOSIS */}
          <FormField
            control={form.control}
            name="dose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosis / Concentración</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. 500mg, 10ml, 0.5%" {...field} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar familia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {families?.map((family) => (
                      <SelectItem key={family.id} value={family.id.toString()}>{family.name}</SelectItem>
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
                  <FormControl><Input type="number" min="0" {...field} /></FormControl>
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
            {/* VÍA DE ADMINISTRACIÓN CON MENÚ INTELIGENTE */}
            <FormField
              control={form.control}
              name="administrationRoute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vía de Administración</FormLabel>
                  {isCustomVia ? (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <FormControl>
                        <Input placeholder="Escribe vía..." {...field} autoFocus />
                      </FormControl>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsCustomVia(false)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <Select 
                      onValueChange={(val) => val === "OTHER" ? setIsCustomVia(true) : field.onChange(val)}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar vía..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VIAS_ADMIN.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        <SelectItem value="OTHER" className="font-bold text-primary">
                          <PlusCircle className="mr-2 h-4 w-4 inline" /> Crear nueva...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field: { value, onChange, ...field } }: { field: any }) => (
                <FormItem>
                  <FormLabel>Foto del Medicamento</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onChange(file);
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Resto de campos se mantienen idénticos */}
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

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción General</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descripción del medicamento..." className="resize-none" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
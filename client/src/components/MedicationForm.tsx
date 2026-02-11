import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicationSchema, type InsertMedication } from "@shared/schema";
import { useFamilies } from "@/hooks/use-families";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, PlusCircle, X, Pill, Activity } from "lucide-react";
import { z } from "zod";

interface MedicationFormProps {
  defaultValues?: Partial<InsertMedication>;
  onSubmit: (data: InsertMedication) => Promise<void>;
  isLoading: boolean;
  submitLabel: string;
}

const PRESENTACIONES = ["Tableta", "Cápsula", "Comprimido", "Suspensión", "Jarabe", "Crema", "Gel", "Ampolla", "Vial"];
const VIAS_ADMIN = ["Oral", "Tópica", "Intravaginal", "Rectal", "Intravenosa", "Intramuscular", "Subcutánea", "Oftálmica"];

const formSchema = insertMedicationSchema.extend({
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa"),
  familyId: z.coerce.number().optional(),
  expirationDate: z.coerce.string().min(1, "La fecha de vencimiento es requerida"),
  dose: z.string().min(1, "La dosis es vital para la seguridad del paciente"), 
  imageUrl: z.union([
    z.instanceof(File),
    z.string(),
    z.null(),
  ]).optional(),
});

export function MedicationForm({ defaultValues, onSubmit, isLoading, submitLabel }: MedicationFormProps) {
  const { data: families } = useFamilies();
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
      // Manejo de fecha para el input type="date"
      expirationDate: defaultValues?.expirationDate 
        ? new Date(defaultValues.expirationDate).toISOString().split('T')[0]
        : "",
    } as any,
  });

  const handleSubmit = (data: any) => {
    // Convertimos la fecha de string a Date antes de enviar
    const formattedData = {
      ...data,
      expirationDate: new Date(data.expirationDate)
    };

    const file = data.imageUrl;
    if (file instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSubmit({ ...formattedData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      onSubmit(formattedData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Nombre Comercial - Más ancho */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" /> Nombre Comercial
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Paracetamol, Ibuprofeno..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* DOSIS / CONCENTRACIÓN - Resaltada al lado del nombre */}
          <FormField
            control={form.control}
            name="dose"
            render={({ field }) => (
              <FormItem className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                <FormLabel className="flex items-center gap-2 text-primary font-bold">
                  <Activity className="h-4 w-4" /> Dosis
                </FormLabel>
                <FormControl>
                  <Input placeholder="500mg, 1gr, 0.5%..." {...field} className="bg-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* PRESENTACIÓN */}
          <FormField
            control={form.control}
            name="presentation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presentación</FormLabel>
                {isCustomPresentation ? (
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="Escribe..." {...field} autoFocus />
                    </FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setIsCustomPresentation(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Select 
                    onValueChange={(val) => val === "OTHER" ? setIsCustomPresentation(true) : field.onChange(val)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRESENTACIONES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      <SelectItem value="OTHER" className="font-bold text-primary italic">+ Otra...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* FAMILIA */}
          <FormField
            control={form.control}
            name="familyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Familia Farmacológica</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccionar familia" /></SelectTrigger>
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

          {/* CANTIDAD Y VENCIMIENTO */}
          <div className="grid grid-cols-2 gap-4 md:col-span-1">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vencimiento</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ... (Secciones de Ficha Técnica se mantienen igual, pero con mejor espaciado) */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-bold text-lg flex items-center gap-2 text-muted-foreground">
            📚 Información Clínica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="administrationRoute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vía de Administración</FormLabel>
                  {isCustomVia ? (
                    <div className="flex gap-2">
                      <FormControl><Input {...field} autoFocus /></FormControl>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsCustomVia(false)}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <Select onValueChange={(val) => val === "OTHER" ? setIsCustomVia(true) : field.onChange(val)} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar vía..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {VIAS_ADMIN.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        <SelectItem value="OTHER" className="font-bold text-primary">+ Otra...</SelectItem>
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
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Foto del empaque</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onChange(file);
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
             <FormField
              control={form.control}
              name="mechanismOfAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mecanismo de Acción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Inhibidor de la COX-2..." className="h-20" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ... Indications and Posology ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="indications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indicaciones</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Dolor leve a moderado..." className="h-20" {...field} value={field.value || ''} />
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
                    <FormLabel>Posología (Instrucciones)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="1 tableta cada 8 horas..." className="h-20" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto px-8">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
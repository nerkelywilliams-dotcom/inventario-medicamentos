"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicationFullSchema, type InsertMedicationFull, type Medication } from "@shared/schema";
import { useFamilies } from "@/hooks/use-families";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, X, Pill, Activity, AlertOctagon, RefreshCw, Baby, Sparkles, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

interface MedicationFormProps {
  defaultValues?: Partial<InsertMedicationFull>;
  onSubmit: (data: InsertMedicationFull) => Promise<void>;
  isLoading: boolean;
  submitLabel: string;
}

const PRESENTACIONES = ["Tableta", "Cápsula", "Comprimido", "Suspensión", "Jarabe", "Crema", "Gel", "Ampolla", "Vial"];
const VIAS_ADMIN = ["Oral", "Tópica", "Intravaginal", "Rectal", "Intravenosa", "Intramuscular", "Subcutánea", "Oftálmica"];

const formSchema = insertMedicationFullSchema;

export function MedicationForm({ defaultValues, onSubmit, isLoading, submitLabel }: MedicationFormProps) {
  const { data: families } = useFamilies();
  const [isCustomPresentation, setIsCustomPresentation] = useState(false);
  const [isCustomVia, setIsCustomVia] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
      contraindications: "",
      interactions: "",
      isPediatric: false,
      ...defaultValues,
      expirationDate: defaultValues?.expirationDate 
        ? new Date(defaultValues.expirationDate).toISOString().split('T')[0]
        : "",
    } as any,
  });

  // --- SOLUCIÓN A LOS 8 ERRORES DE TIPADO ---
  const { data: existingCatalog } = useQuery<Medication>({
    queryKey: [`/api/medication-catalog/search/${searchTerm}`],
    enabled: searchTerm.length > 2,
    retry: false,
  });

  const handleAutofill = () => {
    if (!existingCatalog) return;
    
    // Usamos type assertion para asegurar a TS que estos campos existen
    const catalog = existingCatalog as any;

    if (catalog.familyId) form.setValue("familyId", catalog.familyId);
    form.setValue("description", catalog.description || "");
    form.setValue("mechanismOfAction", catalog.mechanismOfAction || "");
    form.setValue("indications", catalog.indications || "");
    form.setValue("posology", catalog.posology || "");
    form.setValue("administrationRoute", catalog.administrationRoute || "");
    form.setValue("contraindications", catalog.contraindications || "");
    form.setValue("interactions", catalog.interactions || "");
    
    setSearchTerm(""); 
  };

  const handleSubmit = (data: any) => {
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
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="flex items-center gap-2 text-base font-bold text-[#1a2b4b]">
                  <Pill className="h-4 w-4 text-primary" /> Nombre Comercial
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="Ej. Paracetamol, Ibuprofeno..." 
                      {...field} 
                      value={field.value ?? ""} 
                      onChange={(e) => {
                        field.onChange(e);
                        setSearchTerm(e.target.value);
                      }}
                    />
                  </div>
                </FormControl>
                
                {existingCatalog && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2 duration-300 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-800 text-sm">
                      <Sparkles className="h-4 w-4 text-blue-500 fill-blue-500" />
                      <span>Ficha encontrada para <strong>{(existingCatalog as any).name}</strong></span>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAutofill}
                      className="h-7 text-xs bg-white border-blue-300 text-blue-700 hover:bg-blue-100 font-bold"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Autocompletar
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dose"
            render={({ field }) => (
              <FormItem className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                <FormLabel className="flex items-center gap-2 text-primary font-bold">
                  <Activity className="h-4 w-4" /> Dosis
                </FormLabel>
                <FormControl>
                  <Input placeholder="500mg, 1gr..." {...field} value={field.value ?? ""} className="bg-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPediatric"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 border-sky-100 p-4 bg-sky-50/50 shadow-sm transition-all hover:bg-white md:col-span-1">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-black text-sky-900 flex items-center gap-2">
                    <Baby className="h-4 w-4 text-sky-500" /> ¿PEDIÁTRICO?
                  </FormLabel>
                  <FormDescription className="text-[10px] leading-tight text-sky-600/80 font-medium">
                    Solo uso infantil.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-sky-500" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="presentation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presentación</FormLabel>
                {isCustomPresentation ? (
                  <div className="flex gap-2">
                    <FormControl><Input {...field} value={field.value ?? ""} autoFocus /></FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setIsCustomPresentation(false)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <Select onValueChange={(val) => val === "OTHER" ? setIsCustomPresentation(true) : field.onChange(val)} value={field.value ?? undefined}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PRESENTACIONES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
            name="familyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Familia Farmacológica</FormLabel>
                <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {families?.map((f) => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4 md:col-span-1">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
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
                  <FormLabel>Vencimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : (field.value ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-bold text-lg flex items-center gap-2 text-muted-foreground">📚 Ficha Farmacológica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="administrationRoute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vía</FormLabel>
                  {isCustomVia ? (
                    <div className="flex gap-2">
                      <FormControl><Input {...field} value={field.value ?? ""} autoFocus /></FormControl>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsCustomVia(false)}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <Select onValueChange={(val) => val === "OTHER" ? setIsCustomVia(true) : field.onChange(val)} value={field.value ?? undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Vía..." /></SelectTrigger></FormControl>
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
              render={({ field: { onChange } }) => (
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

          <FormField
            control={form.control}
            name="mechanismOfAction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mecanismo de Acción</FormLabel>
                <FormControl><Textarea className="h-20" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="indications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indicaciones</FormLabel>
                  <FormControl><Textarea className="h-20" {...field} value={field.value ?? ""} /></FormControl>
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
                  <FormControl><Textarea className="h-20" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contraindications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-destructive font-bold"><AlertOctagon className="h-4 w-4" /> Contraindicaciones</FormLabel>
                  <FormControl><Textarea className="h-24 border-destructive/20" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interactions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-amber-600 font-bold"><RefreshCw className="h-4 w-4" /> Interacciones</FormLabel>
                  <FormControl><Textarea className="h-24 border-amber-200" {...field} value={field.value ?? ""} /></FormControl>
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
                <FormLabel>Descripción Adicional</FormLabel>
                <FormControl><Textarea className="h-20" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
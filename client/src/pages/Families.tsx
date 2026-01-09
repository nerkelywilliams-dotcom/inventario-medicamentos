import { useState } from "react";
import { useFamilies, useCreateFamily } from "@/hooks/use-families";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFamilySchema, type InsertFamily } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderPlus, Layers, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Families() {
  const { data: families, isLoading } = useFamilies();
  const createMutation = useCreateFamily();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertFamily>({
    resolver: zodResolver(insertFamilySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: InsertFamily) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: "Familia Creada", description: `La familia "${data.name}" ha sido agregada.` });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear la familia.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Familias Farmacéuticas</h2>
          <p className="text-muted-foreground">Clasificación y organización de medicamentos.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <FolderPlus className="h-4 w-4" /> Nueva Familia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Familia</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Analgésicos" {...field} />
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
                      <FormLabel>Descripción (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Breve descripción de la familia..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Familia
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : families?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
            <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No hay familias registradas</p>
          </div>
        ) : (
          families?.map((family) => (
            <Card key={family.id} className="hover:border-primary/50 transition-colors group cursor-default">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Layers className="h-5 w-5 opacity-70" />
                  {family.name}
                </CardTitle>
                {family.description && (
                  <CardDescription className="line-clamp-2">
                    {family.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground font-medium bg-muted inline-block px-2 py-1 rounded">
                  ID: {family.id}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

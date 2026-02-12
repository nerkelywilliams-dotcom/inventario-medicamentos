import { useState } from "react";
import { 
  useFamilies, 
  useCreateFamily, 
  useUpdateFamily, 
  useDeleteFamily 
} from "@/hooks/use-families";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFamilySchema, type InsertFamily, type Family } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FolderPlus, 
  Loader2, 
  Pencil, 
  Trash2, 
  Pill
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Families() {
  const { data: families, isLoading } = useFamilies();
  const createMutation = useCreateFamily();
  const updateMutation = useUpdateFamily();
  const deleteMutation = useDeleteFamily();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  
  const { toast } = useToast();

  const form = useForm<InsertFamily>({
    resolver: zodResolver(insertFamilySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleEdit = (family: Family) => {
    setEditingFamily(family);
    form.reset({
      name: family.name,
      description: family.description || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    // Usamos confirmación nativa del navegador para evitar el error del componente faltante
    if (window.confirm("¿Estás segura de que quieres eliminar esta familia? Esta acción no se puede deshacer.")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: "Familia eliminada", description: "El registro ha sido borrado exitosamente." });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo eliminar la familia.", variant: "destructive" });
      }
    }
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingFamily(null);
      form.reset({ name: "", description: "" });
    }
  };

  const onSubmit = async (data: InsertFamily) => {
    try {
      if (editingFamily) {
        await updateMutation.mutateAsync({ id: editingFamily.id, ...data });
        toast({ title: "Familia Actualizada", description: `Se han guardado los cambios en "${data.name}".` });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: "Familia Creada", description: `La familia "${data.name}" ha sido agregada.` });
      }
      handleClose(false);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Hubo un problema al guardar la familia.", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Familias Farmacológicas</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las categorías y grupos terapéuticos del inventario.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="mr-2 h-4 w-4" />
              Nueva Familia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFamily ? "Editar Familia" : "Crear Nueva Familia"}
              </DialogTitle>
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
                        <Input placeholder="Ej. Analgésicos, Antibióticos..." {...field} />
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
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción breve de la familia farmacológica..." 
                          className="resize-none"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingFamily ? "Guardar Cambios" : "Crear Familia"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {families?.map((family) => (
          <Card key={family.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {family.name}
              </CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2 min-h-[40px]">
                {family.description || "Sin descripción disponible."}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleEdit(family)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDelete(family.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {families?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FolderPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No hay familias registradas</h3>
            <p className="text-muted-foreground mb-4">Comienza creando la primera familia farmacológica.</p>
            <Button onClick={() => setIsOpen(true)}>Crear Familia</Button>
          </div>
        )}
      </div>
    </div>
  );
}
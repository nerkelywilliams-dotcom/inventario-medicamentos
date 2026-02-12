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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FolderPlus, 
  Layers, 
  Loader2, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  AlertCircle 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Families() {
  const { data: families, isLoading } = useFamilies();
  const createMutation = useCreateFamily();
  const updateMutation = useUpdateFamily();
  const deleteMutation = useDeleteFamily();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [familyToDelete, setFamilyToDelete] = useState<number | null>(null);
  
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
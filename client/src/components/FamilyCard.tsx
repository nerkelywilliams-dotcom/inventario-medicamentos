"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Edit, Trash2 } from "lucide-react";
import { Family } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { FamilyForm } from "@/components/FamilyForm";

interface FamilyCardProps {
  family: any;
  onDelete?: () => void;
  onUpdate?: (data: any) => void;
}

export function FamilyCard({ family, onDelete, onUpdate }: FamilyCardProps) {
  // Estado para controlar la apertura del modal de edición
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Manejador para la actualización
  const handleUpdate = (data: any) => {
    if (onUpdate) {
      onUpdate(data);
      setIsEditDialogOpen(false); // Cerramos el modal tras guardar
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white group">
      <CardHeader className="pb-2 border-b border-slate-50 bg-slate-50/50">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* MODAL DE EDICIÓN */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-primary"
                  title="Editar familia"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Grupo Terapéutico</DialogTitle>
                </DialogHeader>
                <FamilyForm 
                  initialData={family} 
                  onSubmit={handleUpdate}
                />
              </DialogContent>
            </Dialog>

            {/* BOTÓN DE ELIMINACIÓN */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation(); // Evita que el clic afecte a otros elementos
                if (onDelete) onDelete();
              }}
              title="Eliminar familia"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CardTitle className="text-xl font-bold text-[#1a2b4b] mt-3 uppercase tracking-tight">
          {family.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <p className="text-sm text-slate-500 italic leading-relaxed">
          {family.description || "Sin descripción disponible."}
        </p>
        
        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
          <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-full uppercase">
            Grupo Terapéutico
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

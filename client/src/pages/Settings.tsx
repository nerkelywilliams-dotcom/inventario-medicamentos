import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { toast } = useToast();

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la llamada a tu API: api.post('/user/change-password', ...)
    toast({
      title: "Contraseña actualizada",
      description: "Tu clave ha sido modificada exitosamente.",
      variant: "default",
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-black text-[#1a2b4b] tracking-tight">Configuración</h2>
        <p className="text-slate-400 font-bold italic">Seguridad y preferencias de cuenta</p>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-[#1a2b4b] text-white p-10">
          <div className="flex items-center gap-4">
            <div className="bg-[#2b4cc4] p-3 rounded-2xl">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">Cambiar Contraseña</CardTitle>
              <CardDescription className="text-slate-300 font-medium mt-1">
                Actualiza tu contraseña periódicamente para mantener tu cuenta segura.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          <form onSubmit={handleUpdate} className="space-y-6 max-w-lg">
            
            <div className="space-y-2">
              <Label className="text-[#1a2b4b] font-bold">Contraseña Actual</Label>
              <div className="relative">
                <Input 
                  type={showCurrent ? "text" : "password"} 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 pr-10"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-3 text-slate-400 hover:text-[#2b4cc4]">
                  {showCurrent ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1a2b4b] font-bold">Nueva Contraseña</Label>
              <div className="relative">
                <Input 
                  type={showNew ? "text" : "password"} 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3 text-slate-400 hover:text-[#2b4cc4]">
                  {showNew ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1a2b4b] font-bold">Confirmar Nueva Contraseña</Label>
              <Input type="password" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
            </div>

            <div className="pt-4">
              <Button type="submit" className="h-12 px-8 rounded-xl bg-[#2b4cc4] hover:bg-[#1a2b4b] text-white font-bold text-base shadow-lg transition-all">
                <Save className="mr-2 h-5 w-5" />
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
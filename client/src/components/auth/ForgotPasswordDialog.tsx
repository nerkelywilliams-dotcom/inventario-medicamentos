import React, { useState } from "react"; // Añadido React aquí
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, KeyRound, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ForgotPasswordDialog() {
  const [step, setStep] = useState(1); // 1: Email, 2: Código + Nueva Pass
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Simulación de envío de correo
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Aquí es donde conectarás con tu servicio de Resend en el futuro
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      toast({ 
        title: "Código enviado", 
        description: `Se ha enviado un código de seguridad a ${email}` 
      });
    }, 1500);
  };

  // Simulación de cambio de contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setOpen(false);
      setStep(1); // Reiniciamos el estado para la próxima vez
      toast({ 
        title: "¡Contraseña actualizada!", 
        description: "Ya puedes iniciar sesión con tu nueva clave.", 
        variant: "default" 
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          type="button" 
          className="text-xs font-bold text-[#1e40af] hover:text-[#059669] transition-colors uppercase tracking-widest"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-800 text-center">
            {step === 1 ? "Recuperar Acceso" : "Validar Código"}
          </DialogTitle>
          <p className="text-center text-slate-400 text-sm font-medium mt-2">
            {step === 1 
              ? "Ingresa tu correo institucional para recibir un código." 
              : `Ingresa el código enviado a ${email}`}
          </p>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold ml-1 text-[10px] uppercase tracking-wider">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 h-5 w-5 text-slate-300" />
                <Input 
                  type="email" 
                  placeholder="ejemplo@iglesiasaragua.org" 
                  className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-[#1e40af] hover:bg-[#059669] font-bold text-white shadow-lg transition-all" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "ENVIAR CÓDIGO"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-600 font-bold ml-1 text-[10px] uppercase tracking-wider">Código de Seguridad</Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3 h-5 w-5 text-slate-300" />
                  <Input 
                    placeholder="000000" 
                    className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200 tracking-[0.5em] font-mono text-lg text-center"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 font-bold ml-1 text-[10px] uppercase tracking-wider">Nueva Contraseña</Label>
                <Input 
                  type="password"
                  placeholder="••••••••"
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-emerald-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-[#059669] hover:bg-[#1e40af] font-bold text-white shadow-lg transition-all" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "RESTABLECER CONTRASEÑA"}
            </Button>
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold mt-2 underline"
            >
              Usar otro correo
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
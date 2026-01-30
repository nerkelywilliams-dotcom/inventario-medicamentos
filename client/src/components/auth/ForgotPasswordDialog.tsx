import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, KeyRound, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ForgotPasswordDialog() {
  const [step, setStep] = useState(1); // 1: Email, 2: Código + Nueva Pass
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Simulación de envío de correo (Aquí conectarías tu API real)
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: await api.post('/auth/forgot-password', { email })
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      toast({ title: "Código enviado", description: "Revisa tu bandeja de entrada." });
    }, 1500);
  };

  // Simulación de cambio de contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: await api.post('/auth/reset-password', { email, code, newPassword })
    setTimeout(() => {
      setIsLoading(false);
      setOpen(false);
      setStep(1);
      toast({ title: "¡Éxito!", description: "Tu contraseña ha sido actualizada.", variant: "default" });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-sm font-bold text-[#2b4cc4] hover:underline hover:text-[#1a2b4b] transition-colors">
          ¿Olvidaste tu contraseña?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-[#1a2b4b] text-center">
            {step === 1 ? "Recuperar Acceso" : "Validar Código"}
          </DialogTitle>
          <p className="text-center text-slate-400 text-sm font-medium">
            {step === 1 
              ? "Ingresa tu correo para recibir un código de seguridad." 
              : `Hemos enviado un código a ${email}`}
          </p>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-[#1a2b4b] font-bold ml-1">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                <Input 
                  type="email" 
                  placeholder="doctor@pharmasys.com" 
                  className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-[#2b4cc4] focus:ring-[#2b4cc4]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-[#2b4cc4] hover:bg-[#1a2b4b] font-bold text-lg shadow-lg shadow-blue-900/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Enviar Código"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#1a2b4b] font-bold ml-1">Código de 6 dígitos</Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="123456" 
                    className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200 tracking-widest font-mono text-lg"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#1a2b4b] font-bold ml-1">Nueva Contraseña</Label>
                <Input 
                  type="password"
                  className="h-12 rounded-xl bg-slate-50 border-slate-200"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-[#2b4cc4] hover:bg-[#1a2b4b] font-bold text-lg shadow-lg shadow-blue-900/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Restablecer Contraseña"}
            </Button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-slate-400 hover:text-[#1a2b4b] font-bold mt-2">
              Volver atrás
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
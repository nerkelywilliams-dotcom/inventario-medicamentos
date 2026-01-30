import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext"; 
import { useLocation } from "wouter"; 
import { User, Lock, Loader2, Eye, EyeOff } from "lucide-react"; 
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog"; // <--- Importación clave

export default function Login() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const onSubmit = async (data: any) => {
    try {
      await login(data.username, data.password);
      setLocation("/");
    } catch (error) {
      console.error("Fallo el ingreso:", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-[2.5rem] shadow-2xl bg-white h-[580px]">
        
        {/* LADO IZQUIERDO */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#059669] to-[#1e40af] flex-col justify-center p-12 text-white relative">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-2 tracking-tight">BIENVENIDO</h2>
            <h3 className="text-lg font-medium mb-8 text-emerald-100 italic">Servicio Social de Iglesias Aragua</h3>
            <div className="border-l-2 border-emerald-400 pl-4 py-2">
                <p className="text-sm leading-relaxed opacity-90">
                    "Abocados a mostrar el amor de Dios al prójimo a través de la acción social."
                </p>
            </div>
          </div>
          <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[10%] w-40 h-40 bg-blue-400/20 rounded-full blur-2xl" />
        </div>

        {/* LADO DERECHO */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-800">Iniciar Sesión</h2>
                <p className="text-slate-400 text-sm font-medium">Gestión Farmacéutica Profesional</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block ml-1">Usuario</label>
                    <div className="relative">
                        <User className="absolute left-4 top-3 h-5 w-5 text-slate-300" />
                        <input 
                            {...register("username", { required: true })}
                            className="w-full pl-12 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            placeholder="Usuario"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block ml-1 text-left">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3 h-5 w-5 text-slate-300" />
                        <input 
                            type={showPassword ? "text" : "password"}
                            {...register("password", { required: true })}
                            className="w-full pl-12 pr-12 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3 text-slate-300 hover:text-slate-500 transition-colors focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    
                    {/* Botón de Olvidaste Contraseña añadido aquí */}
                    <div className="flex justify-end mt-2">
                      <ForgotPasswordDialog />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center uppercase tracking-wider text-sm mt-4"
                >
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Ingresar al Sistema"}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}
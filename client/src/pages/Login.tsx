import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext"; 
import { useLocation } from "wouter"; 
import { User, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"; 

export default function Login() {
  const auth = useAuth();
  const [, setLocation] = useLocation();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  // --- EL SENSOR DE TELETRANSPORTE ---
  // Si el sistema detecta que ya hay un usuario, nos vamos al Home de una vez
  useEffect(() => {
    if (auth?.user) {
      setLocation("/");
    }
  }, [auth?.user, setLocation]);

  const onSubmit = async (data: any) => {
    try {
      // Enviamos los datos limpios al servidor
      if (auth && 'login' in auth) {
        await (auth as any).login(data);
      } else if (auth && 'loginMutation' in auth) {
        await (auth as any).loginMutation.mutateAsync(data);
      }
      // Si todo sale bien, forzamos la entrada
      setLocation("/");
    } catch (error: any) {
      console.error("Error en login:", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f4f8] p-4 font-sans text-slate-900">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] bg-white h-[600px]">
        
        {/* LADO IZQUIERDO: Identidad Aragua */}
        <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-[#059669] to-[#1e40af] flex-col justify-center p-12 text-white">
          <div className="absolute top-[-50px] left-[-50px] h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase">SSIA Aragua</h2>
            <div className="h-1 w-20 bg-emerald-400 mb-8 rounded-full" />
            <p className="text-sm leading-relaxed text-blue-50 font-medium opacity-90 border-l-4 border-emerald-400 pl-4 italic">
              "Abocados a mostrar el amor de Dios al prójimo a través de la acción social."
            </p>
          </div>
          {/* Logo pequeño flotante */}
          <div className="absolute bottom-10 left-12 opacity-20">
             <h1 className="text-6xl font-bold tracking-tighter">ARAGUA</h1>
          </div>
        </div>

        {/* LADO DERECHO: Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center bg-white relative">
            <div className="mb-10">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Iniciar Sesión</h2>
                <p className="text-slate-400 text-sm mt-2 font-semibold">Gestión Farmacéutica Profesional</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Usuario</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                        <input 
                            {...register("username", { required: true })}
                            className="w-full pl-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-700 font-medium"
                            placeholder="Ej: admin_magdaleno"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                        <input 
                            type="password"
                            {...register("password", { required: true })}
                            className="w-full pl-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-700 font-medium"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {/* Si ya estamos logueados pero la página no cambió, avisamos */}
                {auth?.user && (
                   <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                     <CheckCircle2 className="h-4 w-4" />
                     <span>Acceso verificado. Redireccionando...</span>
                   </div>
                )}

                <button 
                    type="submit" 
                    disabled={isSubmitting || !!auth?.user}
                    className="w-full h-14 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-[0.97] flex items-center justify-center disabled:opacity-50 mt-4"
                >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin h-6 w-6" />
                    ) : "ENTRAR AL SISTEMA"}
                </button>
            </form>
            
            <p className="mt-8 text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
              Servicio Social de Iglesias Aragua
            </p>
        </div>
      </div>
    </div>
  );
}
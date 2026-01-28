import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth"; // Ruta estándar de tu proyecto
import { User, Lock, Loader2, AlertCircle } from "lucide-react"; 

export default function Login() {
  const { loginMutation } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-4 font-sans text-slate-900">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white h-[600px]">
        
        {/* LADO IZQUIERDO: Diseño Aragua */}
        <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-[#059669] to-[#1d4ed8] flex-col justify-center p-12 text-white">
          <div className="absolute top-[-50px] left-[-50px] h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-20px] right-[-20px] h-60 w-60 rounded-full bg-blue-400/20 blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight uppercase">Bienvenido</h2>
            <h3 className="text-xl font-medium mb-8 text-emerald-100 italic border-b border-white/20 pb-4">SSIA Aragua</h3>
            <p className="text-sm leading-relaxed text-blue-50 opacity-90 border-l-4 border-emerald-400 pl-4">
              "Mostrando el amor de Dios al prójimo a través de la acción social."
            </p>
          </div>
        </div>

        {/* LADO DERECHO: Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center bg-white">
            <div className="mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Iniciar Sesión</h2>
                <p className="text-slate-400 text-sm mt-2">Ingrese sus credenciales de acceso</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Usuario</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            {...register("username", { required: "El usuario es necesario" })}
                            className="w-full pl-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                            placeholder="Usuario"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Contraseña</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="password"
                            {...register("password", { required: "Contraseña necesaria" })}
                            className="w-full pl-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {/* Mensaje de error si falla el login */}
                {loginMutation?.isError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                    <AlertCircle className="h-4 w-4" />
                    <span>Usuario o contraseña incorrectos</span>
                  </div>
                )}

                <button 
                    type="submit" 
                    disabled={loginMutation?.isPending}
                    className="w-full h-14 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50 mt-4"
                >
                    {loginMutation?.isPending ? (
                      <Loader2 className="animate-spin h-6 w-6" />
                    ) : "ENTRAR AL SISTEMA"}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}
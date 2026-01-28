import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { User, Lock, Loader2 } from "lucide-react"; 

export default function Login() {
  const { loginMutation } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl bg-white h-[600px]">
        
        {/* LADO IZQUIERDO */}
        <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-emerald-600 to-blue-700 flex-col justify-center p-12 text-white">
          <div className="absolute top-[-50px] left-[-50px] h-40 w-40 rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-2">BIENVENIDO</h2>
            <h3 className="text-xl font-medium mb-6 text-emerald-100 italic">SSIA Aragua</h3>
            <p className="text-sm leading-relaxed text-blue-50 opacity-90 border-l-4 border-emerald-400 pl-4">
              Gestión farmacéutica profesional para el servicio social.
            </p>
          </div>
        </div>

        {/* LADO DERECHO */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white text-slate-800">
            <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-bold tracking-tight">Iniciar Sesión</h2>
                <p className="text-slate-500 text-sm mt-2">Ingrese sus datos de acceso</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">Usuario</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <input 
                            {...register("username", { required: true })}
                            className="w-full pl-10 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            placeholder="admin_magdaleno"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <input 
                            type="password"
                            {...register("password", { required: true })}
                            className="w-full pl-10 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loginMutation.isPending}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70"
                >
                    {loginMutation.isPending ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : "ENTRAR AL SISTEMA"}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext"; 
import { User, Lock, Loader2, AlertCircle } from "lucide-react"; 

export default function Login() {
  // Extraemos lo que el contexto realmente ofrece
  // Si tu contexto usa nombres diferentes, aquí los adaptamos
  const auth = useAuth();
  
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      // Intentamos usar 'login' o 'loginMutation.mutate' según lo que exista
      if (auth && 'login' in auth) {
        await (auth as any).login(data);
      } else if (auth && 'loginMutation' in auth) {
        await (auth as any).loginMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Error al iniciar sesión", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-[2.5rem] shadow-[0_22px_70px_4px_rgba(0,0,0,0.1)] bg-white h-[600px]">
        
        {/* LADO IZQUIERDO: SSIA Aragua */}
        <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-emerald-600 to-blue-700 flex-col justify-center p-12 text-white">
          <div className="absolute top-[-50px] left-[-50px] h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tighter uppercase">Bienvenido</h2>
            <h3 className="text-xl font-medium mb-8 text-emerald-100 italic border-b border-white/20 pb-4">Servicio Social de Iglesias Aragua</h3>
            <p className="text-sm leading-relaxed text-blue-50 opacity-90 border-l-4 border-emerald-400 pl-4">
              "Abocados a mostrar el amor de Dios al prójimo a través de la acción social."
            </p>
          </div>
        </div>

        {/* LADO DERECHO: Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center bg-white">
            <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Iniciar Sesión</h2>
                <p className="text-slate-400 text-sm mt-2 font-medium">Gestión Farmacéutica Profesional</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Usuario</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            {...register("username", { required: true })}
                            className="w-full pl-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                            placeholder="Nombre de usuario"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Contraseña</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="password"
                            {...register("password", { required: true })}
                            className="w-full pl-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50 mt-4"
                >
                    {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "INGRESAR AL SISTEMA"}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}
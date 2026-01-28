import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../hooks/use-auth"; // Ruta relativa directa para evitar errores de Render
import { User, Lock, Loader2 } from "lucide-react"; 

export default function Login() {
  const auth = useAuth();
  // Verificamos si auth existe para evitar que la pantalla se ponga blanca
  const loginMutation = auth?.loginMutation;
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    loginMutation?.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 font-sans text-slate-900">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl bg-white h-[600px]">
        
        {/* LADO IZQUIERDO: Diseño Aragua */}
        <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-emerald-600 to-blue-700 flex-col justify-center p-12 text-white">
          <div className="absolute top-[-50px] left-[-50px] h-40 w-40 rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-2 tracking-tighter">BIENVENIDO</h2>
            <h3 className="text-xl font-medium mb-6 text-emerald-100">SSIA Aragua</h3>
            <p className="text-sm leading-relaxed text-blue-50 opacity-90 border-l-4 border-emerald-400 pl-4 italic">
              "Abocados a mostrar el amor de Dios al prójimo a través de la acción social."
            </p>
          </div>
        </div>

        {/* LADO DERECHO: Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
            <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Iniciar Sesión</h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">Gestión Farmacéutica Profesional</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1 text-slate-700">Nombre de Usuario</label>
                    <div className="relative text-slate-400 focus-within:text-emerald-500 transition-colors">
                        <User className="absolute left-3 top-3.5 h-5 w-5" />
                        <input 
                            {...register("username", { required: true })}
                            className="w-full pl-10 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 transition-all shadow-sm"
                            placeholder="Usuario"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1 text-slate-700">Contraseña</label>
                    <div className="relative text-slate-400 focus-within:text-emerald-500 transition-colors">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5" />
                        <input 
                            type="password"
                            {...register("password", { required: true })}
                            className="w-full pl-10 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 transition-all shadow-sm"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loginMutation?.isPending}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                    {loginMutation?.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>VERIFICANDO...</span>
                      </div>
                    ) : "ENTRAR AL SISTEMA"}
                </button>
            </form>
            
            <p className="mt-8 text-center text-xs text-slate-400 font-medium tracking-wide">
              © 2026 SERVICIO SOCIAL DE IGLESIAS ARAGUA
            </p>
        </div>
      </div>
    </div>
  );
}
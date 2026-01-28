import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock } from "lucide-react"; 

export default function Login() {
  const { loginMutation } = useAuth();
  
  // Configuración del formulario con react-hook-form
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4 font-sans">
      {/* Contenedor Principal */}
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl bg-white h-[600px]">
        
        {/* LADO IZQUIERDO: Diseño Institucional */}
        <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-emerald-600 to-blue-700 flex-col justify-center p-12 text-white">
          {/* Efectos de fondo (Círculos) */}
          <div className="absolute top-[-50px] left-[-50px] h-40 w-40 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-blue-500/20 blur-2xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-2 tracking-tight">BIENVENIDO</h2>
            <h3 className="text-xl font-medium mb-6 text-emerald-100 italic">Servicio Social de Iglesias Aragua</h3>
            
            <p className="text-sm leading-relaxed text-blue-50 opacity-90 border-l-4 border-emerald-400 pl-4">
              Institución cristiana interdenominacional al servicio de la nación, 
              abocada a mostrar el amor de Dios al prójimo a través de la acción social.
            </p>
          </div>
        </div>

        {/* LADO DERECHO: Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
            <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Iniciar Sesión</h2>
                <p className="text-gray-500 text-sm mt-2">Gestión Farmacéutica SSIA</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Campo Usuario */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Nombre de Usuario</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <Input 
                            {...register("username", { required: "El usuario es obligatorio" })}
                            className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all rounded-xl"
                            placeholder="Ej. admin_magdaleno"
                        />
                    </div>
                    {errors.username && <span className="text-red-500 text-xs ml-1">{errors.username.message as string}</span>}
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <Input 
                            type="password"
                            {...register("password", { required: "La contraseña es obligatoria" })}
                            className="pl-10 h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all rounded-xl"
                            placeholder="••••••••"
                        />
                    </div>
                    {errors.password && <span className="text-red-500 text-xs ml-1">{errors.password.message as string}</span>}
                </div>

                {/* Opciones adicionales */}
                <div className="flex items-center justify-between text-xs px-1">
                    <label className="flex items-center space-x-2 text-gray-500 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                        <span>Recordarme</span>
                    </label>
                    <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors font-medium">¿Olvidó su contraseña?</a>
                </div>

                {/* Botón Rojo Institucional */}
                <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 text-white rounded-xl transition-all active:scale-95 disabled:opacity-70"
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        CARGANDO...
                      </div>
                    ) : "ENTRAR AL SISTEMA"}
                </Button>

            </form>
            
            <p className="mt-8 text-center text-xs text-gray-400">
              © 2026 SSIA Aragua - Panel de Control
            </p>
        </div>
      </div>
    </div>
  );
}
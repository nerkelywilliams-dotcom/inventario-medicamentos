import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { User, Lock } from "lucide-react"; // Iconos

export default function AuthPage() {
  const { loginMutation } = useAuth();
  
  // Configuración simple del formulario
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      {/* Contenedor Principal con Sombra y Bordes Redondeados */}
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl bg-white h-[600px]">
        
        {/* LADO IZQUIERDO: Diseño Gráfico y Texto */}
        <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-emerald-600 to-blue-700 flex-col justify-center p-12 text-white">
          {/* Círculos Decorativos (Efecto de fondo) */}
          <div className="absolute top-[-50px] left-[-50px] h-40 w-40 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-blue-500/30 blur-2xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-2">BIENVENIDO</h2>
            <h3 className="text-xl font-medium mb-6 text-emerald-100">Servicio Social de Iglesias Aragua</h3>
            
            <p className="text-sm leading-relaxed text-blue-50 opacity-90">
              Institución cristiana interdenominacional al servicio de la nación, 
              abocada a mostrar el amor de Dios al prójimo a través de la acción social.
            </p>
          </div>
        </div>

        {/* LADO DERECHO: Formulario de Login */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
            <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-800">Iniciar Sesión</h2>
                <p className="text-gray-400 text-sm mt-2">Ingrese sus credenciales para acceder al sistema</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Campo Usuario */}
                <div className="space-y-2">
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input 
                            id="username"
                            {...register("username", { required: true })}
                            className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            placeholder="Ej. admin_magdaleno"
                        />
                    </div>
                    {errors.username && <span className="text-red-500 text-xs">Este campo es requerido</span>}
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input 
                            id="password"
                            type="password"
                            {...register("password", { required: true })}
                            className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            placeholder="••••••••"
                        />
                        <button type="button" className="absolute right-3 top-3.5 text-xs font-semibold text-gray-500 hover:text-blue-600">
                            SHOW
                        </button>
                    </div>
                    {errors.password && <span className="text-red-500 text-xs">La contraseña es requerida</span>}
                </div>

                {/* Checkbox y Olvidé contraseña */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <label htmlFor="remember" className="text-gray-500 cursor-pointer">Recordarme</label>
                    </div>
                    <a href="#" className="text-gray-400 hover:text-gray-600">¿Olvidó su contraseña?</a>
                </div>

                {/* Botón Rojo Institucional */}
                <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all duration-300"
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending ? "INGRESANDO..." : "INICIAR SESIÓN"}
                </Button>

            </form>
        </div>
      </div>
    </div>
  );
}
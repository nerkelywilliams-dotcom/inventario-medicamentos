import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast({ title: 'Bienvenido', description: 'Sesión iniciada correctamente.' });
    } catch (error) {
      toast({
        title: 'Error de autenticación',
        description: error instanceof Error ? error.message : 'Usuario o contraseña incorrectos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-transparent flex flex-col md:flex-row">
        {/* Left informational panel */}
        <div className="relative md:w-2/3 w-full p-10 md:p-16 bg-secondary text-secondary-foreground flex flex-col justify-center gap-6">
          {/* Logo */}
          <div className="mb-4 hidden md:flex justify-start">
            <img src="/logo.svg" alt="Logo Iglesias Aragua" className="h-24 w-24 object-contain" />
          </div>
          <div className="max-w-lg">
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">BIENVENIDO</h1>
            <h2 className="mt-1 text-lg md:text-xl font-medium text-white/90">Servicio Social de Iglesias Aragua</h2>
            <p className="mt-6 text-sm md:text-base text-white/90 leading-relaxed">
              Institución cristiana interdenominacional al servicio de la nación, abocada a mostrar el amor de Dios al
              prójimo, a través de la acción social.
            </p>
          </div>

          {/* Decorative circles */}
          <div className="hidden md:block">
            <div className="absolute -bottom-6 -left-6 h-36 w-36 rounded-full bg-primary/80 mix-blend-multiply opacity-80"></div>
            <div className="absolute -bottom-14 left-28 h-44 w-44 rounded-full bg-primary/60 mix-blend-multiply opacity-70"></div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="md:w-1/3 w-full bg-card p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              {/* Logo mobile */}
              <div className="flex justify-center mb-4 md:hidden">
                <img src="/logo.svg" alt="Logo Iglesias Aragua" className="h-16 w-16 object-contain" />
              </div>
              <h3 className="text-3xl font-display font-bold text-foreground">Iniciar Sesión</h3>
              <p className="text-sm text-muted-foreground mt-2">Ingresa tu usuario y contraseña para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Usuario</label>
                <Input
                  type="text"
                  placeholder="admin o usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-muted/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                    aria-label="Mostrar contraseña"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-destructive text-white hover:brightness-95" disabled={isLoading || !username || !password}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Iniciando sesión...' : 'INICIAR SESIÓN'}
              </Button>

              <div className="text-center mt-2">
                <button type="button" className="text-sm text-muted-foreground hover:underline">Olvidé mi Contraseña</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-transparent flex flex-col md:flex-row">
        {/* Left informational panel */}
        <div className="relative md:w-2/3 w-full p-8 md:p-16 bg-secondary text-secondary-foreground flex flex-col justify-center items-center md:items-start gap-8">
          {/* Logo */}
          <div className="w-28 h-28 md:w-32 md:h-32 flex-shrink-0">
            <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Fondo gris claro */}
              <circle cx="120" cy="120" r="115" fill="#f0f0f0" stroke="#e0e0e0" strokeWidth="2"/>
              
              {/* Teal/Verde izquierda (S) */}
              <path d="M 70 80 Q 50 60 50 110 Q 50 150 75 160 L 95 145 Q 75 140 75 110 Q 75 85 95 70 Z" fill="#1a9b7e"/>
              <path d="M 75 160 Q 50 150 50 180 L 75 175 Z" fill="#17866f"/>
              
              {/* Azul oscuro derecha (S) */}
              <path d="M 145 70 Q 165 60 180 80 Q 190 100 175 140 Q 165 155 145 160 L 145 135 Q 160 135 165 115 Q 170 95 160 85 L 145 95 Z" fill="#001f6e"/>
              
              {/* Cruz roja (símbolo médico) */}
              <g fill="#e63946">
                <rect x="110" y="50" width="20" height="50" rx="3"/>
                <rect x="90" y="70" width="60" height="20" rx="3"/>
              </g>
              
              {/* Blanco detalles */}
              <circle cx="80" cy="125" r="6" fill="#ffffff"/>
              <path d="M 145 110 L 155 105 L 150 115" fill="#ffffff"/>
              
              {/* Texto "Aragua" */}
              <text x="120" y="205" fontSize="28" fontWeight="bold" fill="#e63946" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">Aragua</text>
            </svg>
          </div>

          <div className="text-center md:text-left max-w-lg">
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">BIENVENIDO</h1>
            <h2 className="mt-3 text-lg md:text-xl font-medium text-white/95">Servicio Social de Iglesias Aragua</h2>
            <p className="mt-6 text-sm md:text-base text-white/90 leading-relaxed">
              Institución cristiana interdenominacional al servicio de la nación, abocada a mostrar el amor de Dios al
              prójimo, a través de la acción social.
            </p>
          </div>

          {/* Decorative circles */}
          <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -bottom-6 -left-6 h-36 w-36 rounded-full bg-primary/80 mix-blend-multiply opacity-80"></div>
            <div className="absolute -bottom-14 left-28 h-44 w-44 rounded-full bg-primary/60 mix-blend-multiply opacity-70"></div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="md:w-1/3 w-full bg-card p-8 md:p-10 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              {/* Logo mobile */}
              <div className="flex justify-center mb-6 md:hidden">
                <div className="w-20 h-20">
                  <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Fondo gris claro */}
                    <circle cx="120" cy="120" r="115" fill="#f0f0f0" stroke="#e0e0e0" strokeWidth="2"/>
                    
                    {/* Teal/Verde izquierda (S) */}
                    <path d="M 70 80 Q 50 60 50 110 Q 50 150 75 160 L 95 145 Q 75 140 75 110 Q 75 85 95 70 Z" fill="#1a9b7e"/>
                    <path d="M 75 160 Q 50 150 50 180 L 75 175 Z" fill="#17866f"/>
                    
                    {/* Azul oscuro derecha (S) */}
                    <path d="M 145 70 Q 165 60 180 80 Q 190 100 175 140 Q 165 155 145 160 L 145 135 Q 160 135 165 115 Q 170 95 160 85 L 145 95 Z" fill="#001f6e"/>
                    
                    {/* Cruz roja (símbolo médico) */}
                    <g fill="#e63946">
                      <rect x="110" y="50" width="20" height="50" rx="3"/>
                      <rect x="90" y="70" width="60" height="20" rx="3"/>
                    </g>
                    
                    {/* Blanco detalles */}
                    <circle cx="80" cy="125" r="6" fill="#ffffff"/>
                    <path d="M 145 110 L 155 105 L 150 115" fill="#ffffff"/>
                    
                    {/* Texto "Aragua" */}
                    <text x="120" y="205" fontSize="28" fontWeight="bold" fill="#e63946" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">Aragua</text>
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl md:text-2xl font-display font-bold text-foreground">Iniciar Sesión</h3>
              <p className="text-sm text-muted-foreground mt-3">Ingresa tu usuario y contraseña para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Usuario</label>
                <Input
                  type="text"
                  placeholder="admin o usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="bg-muted/50 w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-muted/50 pr-10 w-full"
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

              <Button type="submit" className="w-full bg-destructive text-white hover:brightness-95 mt-6" disabled={isLoading || !username || !password}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Iniciando sesión...' : 'INICIAR SESIÓN'}
              </Button>

              <div className="text-center">
                <button type="button" className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors">Olvidé mi Contraseña</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Mail, Loader2, Lock, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CinematicBackground from "@/components/CinematicBackground";
import zyraProLogoLogin from "@/assets/zyra-pro-logo-login.png";

const STORAGE_KEYS = {
  email: "lov_access_email",
  name: "lov_user_name",
  document: "lov_user_document",
  fingerprint: "lov_user_fingerprint",
  licenseKey: "lov_license_key",
  phone: "lov_user_phone",
  subscriptions: "lov_subscriptions",
  purchasedProducts: "lov_purchased_products",
};

interface PasswordGateProps {
  children: React.ReactNode;
}

type AuthMode = "login" | "register";

const PasswordGate = ({ children }: PasswordGateProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  useEffect(() => {
    // Check if already authenticated in this session
    const accessEmail = sessionStorage.getItem(STORAGE_KEYS.email);
    if (accessEmail) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const storeUserData = (userData: Record<string, unknown>) => {
    if (userData.name) sessionStorage.setItem(STORAGE_KEYS.name, userData.name as string);
    if (userData.email) sessionStorage.setItem(STORAGE_KEYS.email, userData.email as string);
    if (userData.document) sessionStorage.setItem(STORAGE_KEYS.document, userData.document as string);
    if (userData.fingerprint) sessionStorage.setItem(STORAGE_KEYS.fingerprint, userData.fingerprint as string);
    if (userData.license_key) sessionStorage.setItem(STORAGE_KEYS.licenseKey, userData.license_key as string);
    if (userData.phone) sessionStorage.setItem(STORAGE_KEYS.phone, userData.phone as string);
    if (userData.subscriptions) sessionStorage.setItem(STORAGE_KEYS.subscriptions, JSON.stringify(userData.subscriptions));
    if (userData.purchased_products) sessionStorage.setItem(STORAGE_KEYS.purchasedProducts, JSON.stringify(userData.purchased_products));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate email
    if (!email.trim() || !email.includes("@")) {
      setError("Digite um email válido.");
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    // Validate confirm password for registration
    if (authMode === "register" && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      const emailLower = email.toLowerCase().trim();

      const response = await fetch(
        "https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/member-auth",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: authMode,
            email: emailLower,
            password 
          }),
        }
      );

      const result = await response.json();

      if (result?.success) {
        if (authMode === "register") {
          setSuccess("Conta criada com sucesso! Fazendo login...");
          // Store user data and authenticate
          if (result.user_data) {
            storeUserData(result.user_data);
          }
          sessionStorage.setItem(STORAGE_KEYS.email, emailLower);
          setTimeout(() => setIsAuthenticated(true), 1000);
        } else {
          // Login successful
          if (result.user_data) {
            storeUserData(result.user_data);
          }
          sessionStorage.setItem(STORAGE_KEYS.email, emailLower);
          setIsAuthenticated(true);
        }
      } else {
        setError(result?.error || "Erro ao processar. Tente novamente.");
      }
    } catch (err) {
      console.error("Error in auth:", err);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === "login" ? "register" : "login");
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <CinematicBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <CinematicBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Card with glassmorphism */}
        <div className="relative p-8 sm:p-10 rounded-3xl border border-border/30 bg-card/40 backdrop-blur-xl shadow-2xl">
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-transparent to-accent/10 rounded-3xl blur-xl -z-10" />
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src={zyraProLogoLogin} 
              alt="Zyra Pro" 
              className="h-12 sm:h-14 w-auto"
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {authMode === "login" ? "Área de Membros" : "Criar Conta"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {authMode === "login" 
                ? "Entre com seu email e senha para acessar" 
                : "Cadastre-se para acessar o conteúdo exclusivo"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 bg-background/50 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-primary/20"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14 bg-background/50 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-primary/20"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Confirm Password (only for registration) */}
            {authMode === "register" && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 bg-background/50 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-primary/20"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-destructive text-sm text-center">
                {error}
              </p>
            )}

            {/* Success message */}
            {success && (
              <p className="text-green-500 text-sm text-center">
                {success}
              </p>
            )}

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {authMode === "login" ? "Entrando..." : "Criando conta..."}
                </>
              ) : (
                <>
                  {authMode === "login" ? (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Entrar
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Criar Conta
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          {/* Toggle auth mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {authMode === "login" ? (
                <>Não tem conta? <span className="text-primary font-medium">Cadastre-se</span></>
              ) : (
                <>Já tem conta? <span className="text-primary font-medium">Faça login</span></>
              )}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Problemas com acesso? Entre em contato pelo Instagram{' '}
            <a href="https://instagram.com/ads.sand" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              @ads.sand
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordGate;

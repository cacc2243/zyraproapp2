import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type AuthMode = "login" | "register";

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthDrawer = ({ isOpen, onClose, onSuccess }: AuthDrawerProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccess("");
        setAuthMode("login");
      }, 300);
    }
  }, [isOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

    if (!email.trim() || !email.includes("@")) {
      setError("Digite um email válido.");
      return;
    }

    if (!password || password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

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
          setSuccess("Conta criada com sucesso!");
          if (result.user_data) {
            storeUserData(result.user_data);
          }
          sessionStorage.setItem(STORAGE_KEYS.email, emailLower);
          setTimeout(() => {
            onSuccess();
          }, 800);
        } else {
          if (result.user_data) {
            storeUserData(result.user_data);
          }
          sessionStorage.setItem(STORAGE_KEYS.email, emailLower);
          setSuccess("Login realizado!");
          setTimeout(() => {
            onSuccess();
          }, 500);
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

  // Transition configs
  const springTransition: Transition = {
    type: "spring",
    damping: 30,
    stiffness: 300,
    mass: 0.8,
  };

  const smoothTransition: Transition = {
    duration: 0.4,
    ease: [0.22, 1, 0.36, 1],
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={smoothTransition}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-md bg-gradient-to-br from-card via-card/98 to-background border-l border-border/30 shadow-2xl overflow-hidden"
            initial={{ 
              x: "100%",
              opacity: 0,
              scale: 0.95,
              borderRadius: "100px 0 0 100px",
            }}
            animate={{ 
              x: 0,
              opacity: 1,
              scale: 1,
              borderRadius: "32px 0 0 32px",
            }}
            exit={{ 
              x: "100%",
              opacity: 0,
              scale: 0.9,
              borderRadius: "100px 0 0 100px",
            }}
            transition={springTransition}
          >
            {/* Floating orbs for fluid effect */}
            <motion.div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, hsl(252 85% 67% / 0.3) 0%, transparent 70%)",
                filter: "blur(40px)"
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
            />
            <motion.div
              className="absolute top-1/3 -left-10 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, hsl(280 80% 60% / 0.25) 0%, transparent 70%)",
                filter: "blur(30px)"
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
            />
            <motion.div
              className="absolute -bottom-10 right-1/4 w-52 h-52 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, hsl(220 80% 60% / 0.2) 0%, transparent 70%)",
                filter: "blur(35px)"
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ ...springTransition, delay: 0.3 }}
            />

            {/* Content */}
            <div className="relative h-full flex flex-col p-6 sm:p-8 overflow-y-auto">
              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ ...springTransition, delay: 0.15 }}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-white/70" />
              </motion.button>

              {/* Logo */}
              <motion.div 
                className="flex justify-center mt-8 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ ...springTransition, delay: 0.2 }}
              >
                <img 
                  src={zyraProLogoLogin} 
                  alt="Zyra Pro" 
                  className="h-12 sm:h-14 w-auto"
                />
              </motion.div>

              {/* Title with sparkle */}
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ ...springTransition, delay: 0.25 }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...springTransition, delay: 0.35 }}
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">Área Exclusiva</span>
                </motion.div>
                
                <motion.h2 
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  key={authMode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {authMode === "login" ? "Área de Membros" : "Criar Conta"}
                </motion.h2>
                <motion.p 
                  className="text-muted-foreground text-sm"
                  key={`desc-${authMode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {authMode === "login" 
                    ? "Entre com seu email e senha" 
                    : "Cadastre-se para acessar"}
                </motion.p>
              </motion.div>

              {/* Form */}
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-4 flex-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ ...springTransition, delay: 0.3 }}
              >
                {/* Email */}
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: 0.35 }}
                >
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 bg-white/5 border-white/10 rounded-xl text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-primary/20 focus:bg-white/10 transition-all"
                    autoFocus
                    disabled={isSubmitting}
                  />
                </motion.div>

                {/* Password */}
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: 0.4 }}
                >
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 bg-white/5 border-white/10 rounded-xl text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-primary/20 focus:bg-white/10 transition-all"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </motion.div>

                {/* Confirm Password */}
                <AnimatePresence mode="wait">
                  {authMode === "register" && (
                    <motion.div 
                      className="relative"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ 
                        opacity: 1, 
                        height: "auto",
                        marginTop: 16,
                      }}
                      exit={{ 
                        opacity: 0, 
                        height: 0,
                        marginTop: 0,
                      }}
                      transition={springTransition}
                    >
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-12 pr-12 h-14 bg-white/5 border-white/10 rounded-xl text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-primary/20 focus:bg-white/10 transition-all"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.p 
                      className="text-destructive text-sm text-center py-2 px-4 rounded-lg bg-destructive/10"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={springTransition}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Success message */}
                <AnimatePresence mode="wait">
                  {success && (
                    <motion.p 
                      className="text-emerald-400 text-sm text-center py-2 px-4 rounded-lg bg-emerald-500/10"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={springTransition}
                    >
                      {success}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: 0.45 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25"
                    disabled={isSubmitting}
                  >
                    <motion.span
                      className="flex items-center justify-center"
                      key={isSubmitting ? "loading" : authMode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {authMode === "login" ? "Entrando..." : "Criando..."}
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
                    </motion.span>
                  </Button>
                </motion.div>

                {/* Toggle auth mode */}
                <motion.div 
                  className="text-center pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...springTransition, delay: 0.5 }}
                >
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
                </motion.div>
              </motion.form>

              {/* Footer */}
              <motion.p 
                className="text-center text-xs text-muted-foreground mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...springTransition, delay: 0.55 }}
              >
                Problemas? Entre em contato pelo{' '}
                <a 
                  href="https://instagram.com/ads.sand" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  @ads.sand
                </a>
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthDrawer;

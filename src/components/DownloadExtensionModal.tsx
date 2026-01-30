import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, Check, Key, Shield, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DownloadExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  extensionName: string;
  extensionId: string;
  licenseKey: string;
}

// Static download data for extensions
const EXTENSION_DATA: Record<string, { extractPassword: string; downloadUrl: string; isUpdating?: boolean }> = {
  lovable: {
    extractPassword: "userhfad516edmf41896484fw3bjkdaop",
    downloadUrl: "https://download1350.mediafire.com/uxwoov3z48ug-3fobyAwufwsHJkKNqCUVrf4-G-I0_ASE5V7V8MP8ItFpS-RPDUjPWaqBxjRNMAswJVPAe2W9Fex00uEtKpyEbtLdUoBHCSQEvUXrMsK_0RTtsY9R4x_Rdmr79k_kWsXz_jO1sj1TcIoUPvoOtSv8c0jJlxYr_Es8tU/42po54l10xjnfx7/Zyra+Pro+v8.5.rar"
  },
  v0: {
    extractPassword: "",
    downloadUrl: "",
    isUpdating: true
  },
  manus: {
    extractPassword: "",
    downloadUrl: "",
    isUpdating: true
  }
};

const loadingMessages = [
  { text: "Verificando sua licença...", icon: Shield },
  { text: "Gerando link seguro...", icon: Lock },
  { text: "Preparando senha de extração...", icon: Key },
  { text: "Finalizando download...", icon: CheckCircle2 },
];

const DownloadExtensionModal = ({
  isOpen,
  onClose,
  extensionName,
  extensionId,
}: DownloadExtensionModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Get extension data (defaults to lovable)
  const extensionData = EXTENSION_DATA[extensionId as keyof typeof EXTENSION_DATA] || EXTENSION_DATA.lovable;

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setCurrentMessageIndex(0);
      setCopiedPassword(false);

      // Animate through loading messages
      const messageInterval = setInterval(() => {
        setCurrentMessageIndex((prev) => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 500);

      // Show content after animation (2 seconds)
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false);
        clearInterval(messageInterval);
      }, 2000);

      return () => {
        clearInterval(messageInterval);
        clearTimeout(loadingTimeout);
      };
    }
  }, [isOpen]);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(extensionData.extractPassword);
    setCopiedPassword(true);
    toast.success('Senha copiada!');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleDownload = () => {
    window.open(extensionData.downloadUrl, '_blank');
  };

  const CurrentIcon = loadingMessages[currentMessageIndex]?.icon || Shield;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative w-full max-w-md"
          >
            {/* Glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-2xl opacity-40" />

            <div className="relative bg-gradient-to-b from-[#1a1625] to-[#0f0b15] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              {/* Content */}
              <div className="p-6">
                {isLoading ? (
                  /* Loading State */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center py-8"
                  >
                    {/* Animated Icon Container */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center"
                      >
                        <motion.div
                          key={currentMessageIndex}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CurrentIcon className="w-8 h-8 text-primary" />
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* Loading Message */}
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentMessageIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm text-white/80 text-center"
                      >
                        {loadingMessages[currentMessageIndex]?.text}
                      </motion.p>
                    </AnimatePresence>

                    {/* Progress Dots */}
                    <div className="flex items-center gap-2 mt-6">
                      {loadingMessages.map((_, index) => (
                        <motion.div
                          key={index}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            index <= currentMessageIndex
                              ? "w-6 bg-gradient-to-r from-primary to-accent"
                              : "w-1.5 bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : extensionData.isUpdating ? (
                  /* Updating State */
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                  >
                    {/* Header */}
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4">
                        <Shield className="w-8 h-8 text-amber-400 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Em Atualização
                      </h3>
                      <p className="text-sm text-white/60">
                        Extensão {extensionName}
                      </p>
                    </div>

                    {/* Update Message */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-center">
                      <p className="text-sm text-amber-200 leading-relaxed">
                        Estamos atualizando o vídeo e download, aguarde alguns minutos...
                      </p>
                    </div>

                    {/* Info */}
                    <p className="text-[11px] text-center text-white/40">
                      A extensão estará disponível em breve. Obrigado pela paciência!
                    </p>
                  </motion.div>
                ) : (
                  /* Success State */
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                  >
                    {/* Header */}
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Download Pronto!
                      </h3>
                      <p className="text-sm text-white/60">
                        Extensão {extensionName}
                      </p>
                    </div>

                    {/* Password Section */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Key className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Senha de Extração
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-black/30 rounded-lg text-sm font-mono text-white/90 break-all">
                          {extensionData.extractPassword}
                        </code>
                        <Button
                          onClick={handleCopyPassword}
                          size="sm"
                          variant="ghost"
                          className="shrink-0 h-9 w-9 p-0 hover:bg-white/10"
                        >
                          {copiedPassword ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-white/60" />
                          )}
                        </Button>
                      </div>

                      <p className="text-[11px] text-white/40">
                        Use esta senha para extrair o arquivo RAR
                      </p>
                      <p className="text-[11px] text-amber-400/80 mt-2">
                        ⚠️ Use o WinRAR para extrair o arquivo
                      </p>
                    </div>

                    {/* Download Button */}
                    <Button
                      onClick={handleDownload}
                      size="lg"
                      className="w-full gap-3 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      <span>Baixar Extensão</span>
                    </Button>

                    {/* Warning */}
                    <p className="text-[10px] text-center text-white/40">
                      Não compartilhe este link ou senha. Uso pessoal e intransferível.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DownloadExtensionModal;

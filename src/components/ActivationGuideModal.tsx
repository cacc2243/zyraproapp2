import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Key, ChevronLeft, ChevronRight } from "lucide-react";
import activationStep1 from "@/assets/activation-step-1.png";
import activationStep2 from "@/assets/activation-step-2.png";

const steps = [
  {
    number: 1,
    title: "Informe a licença",
    description: "Informe a licença recebida na área de membros (ZYRA-XXXX-XXXX-XXXX).",
    image: activationStep1,
  },
  {
    number: 2,
    title: "Ative no Lovable",
    description: "Abra a extensão logado no Lovable, atualize a página e pronto!",
    image: activationStep2,
  },
];

interface ActivationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivationGuideModal = ({ isOpen, onClose }: ActivationGuideModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative w-full max-w-sm"
          >
            {/* Glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-2xl opacity-40" />

            <div className="relative bg-gradient-to-b from-[#1a1625] to-[#0f0b15] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              {/* Header */}
              <div className="pt-5 pb-3 px-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/30">
                    <Key className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Como Ativar</h3>
                    <p className="text-xs text-white/50">Siga os passos abaixo</p>
                  </div>
                </div>
              </div>

              {/* Step indicators */}
              <div className="flex items-center justify-center gap-2 px-5 pb-4">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? "w-8 bg-gradient-to-r from-primary to-accent"
                        : "w-1.5 bg-white/20 hover:bg-white/30"
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="px-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Step badge */}
                    <div className="flex justify-center mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-[11px] font-semibold">
                        Passo {steps[currentStep].number} de {steps.length}
                      </span>
                    </div>

                    {/* Image container */}
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20 mb-4">
                      <img
                        src={steps[currentStep].image}
                        alt={`Passo ${steps[currentStep].number}`}
                        className="w-full h-auto max-h-[280px] object-contain"
                      />
                    </div>

                    {/* Text */}
                    <div className="text-center pb-2">
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {steps[currentStep].title}
                      </h4>
                      <p className="text-xs text-white/60 leading-relaxed px-2">
                        {steps[currentStep].description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 p-4 mt-2 border-t border-white/5">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    currentStep === 0
                      ? "opacity-30 cursor-not-allowed bg-white/5 text-white/40"
                      : "bg-white/10 hover:bg-white/15 text-white"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>

                {currentStep === steps.length - 1 ? (
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Entendi!
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ActivationGuideModal;

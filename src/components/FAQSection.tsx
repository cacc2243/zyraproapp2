import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";

const faqs = [
  { 
    q: "A extensão funciona mesmo?", 
    a: "Sim! Testada e validada por dezenas de usuários satisfeitos. A extensão é atualizada constantemente para garantir compatibilidade." 
  },
  { 
    q: "Preciso de conhecimento técnico?", 
    a: "Não! A instalação é super simples e qualquer pessoa consegue fazer. Incluímos um tutorial passo a passo." 
  },
  { 
    q: "Quanto tempo leva para configurar?", 
    a: "Menos de 5 minutos para instalar e começar a usar. É plug and play!" 
  },
  { 
    q: "O que é o Grupo VIP?", 
    a: "Grupo exclusivo no WhatsApp para suporte prioritário, atualizações em primeira mão e networking com outros usuários." 
  },
  { 
    q: "Tem garantia?", 
    a: "Sim! 7 dias de garantia incondicional. Se não gostar, devolvemos 100% do valor sem perguntas." 
  },
];

const FAQItem = ({ faq, index, isOpen, onClick }: { 
  faq: typeof faqs[0]; 
  index: number; 
  isOpen: boolean; 
  onClick: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group"
    >
      <div
        className={`
          relative rounded-2xl overflow-hidden transition-all duration-300
          ${isOpen 
            ? 'bg-gradient-to-br from-primary/15 to-accent/10 border-primary/30' 
            : 'bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-white/10 hover:border-white/20'
          }
          border backdrop-blur-sm
        `}
      >
        {/* Question button */}
        <button
          onClick={onClick}
          className="w-full flex items-center gap-4 p-4 sm:p-5 text-left"
        >
          {/* Number */}
          <div className={`
            shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors
            ${isOpen 
              ? 'bg-primary text-white' 
              : 'bg-white/10 text-white/50 group-hover:bg-white/15'
            }
          `}>
            {String(index + 1).padStart(2, '0')}
          </div>

          {/* Question text */}
          <span className={`
            flex-1 text-sm sm:text-base font-semibold transition-colors
            ${isOpen ? 'text-white' : 'text-white/80 group-hover:text-white'}
          `}>
            {faq.q}
          </span>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`
              shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors
              ${isOpen 
                ? 'bg-white/10' 
                : 'bg-transparent group-hover:bg-white/5'
              }
            `}
          >
            <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? 'text-primary' : 'text-white/40'}`} />
          </motion.div>
        </button>

        {/* Answer */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-4 sm:px-5 pb-5 pt-0">
                <div className="pl-12 border-l-2 border-primary/30 ml-4">
                  <p className="text-sm text-white/70 leading-relaxed pl-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 pb-8">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="container relative z-10 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              Tire suas dúvidas
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Perguntas <span className="text-gradient">Frequentes</span>
            </h2>
            <p className="text-sm text-white/50">
              Respondemos as dúvidas mais comuns sobre a Zyra Pro
            </p>
          </motion.div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                index={i}
                isOpen={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-white/40 mb-3">Ainda tem dúvidas?</p>
            <a
              href="https://wa.me/5541984953526"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Fale com o suporte
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

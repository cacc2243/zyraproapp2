import { motion } from "framer-motion";
import { Users, Zap, DollarSign, Clock, CheckCircle2 } from "lucide-react";

const audiences = [
  {
    icon: Users,
    text: "Quer usar o Lovable sem depender de créditos pagos",
    highlight: "sem créditos"
  },
  {
    icon: Zap,
    text: "Busca uma extensão simples e funcional",
    highlight: "simples"
  },
  {
    icon: DollarSign,
    text: "Quer criar projetos sem gastar com mensalidade",
    highlight: "sem mensalidade"
  },
  {
    icon: Clock,
    text: "Valoriza acesso rápido e sempre atualizado",
    highlight: "sempre atualizado"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const TargetAudienceSection = () => {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

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
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Público Ideal
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Para quem é <span className="text-gradient">esse conteúdo?</span>
            </h2>
            <p className="text-sm text-white/50">
              Se você se identifica com algum desses pontos, a Zyra Pro é para você
            </p>
          </motion.div>

          {/* Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="space-y-3"
          >
            {audiences.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative"
              >
                {/* Card */}
                <div className="relative flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/30 hover:from-white/[0.09] hover:to-white/[0.04]">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 blur-xl" />
                  </div>

                  {/* Number indicator */}
                  <div className="absolute top-2 right-3 text-[10px] font-bold text-white/20">
                    0{index + 1}
                  </div>

                  {/* Icon container */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
                      <item.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    {/* Ring effect */}
                    <div className="absolute -inset-1 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
                  </div>

                  {/* Text */}
                  <div className="relative flex-1 min-w-0">
                    <p className="text-sm sm:text-base text-white font-medium leading-relaxed">
                      {item.text}
                    </p>
                  </div>

                  {/* Checkmark */}
                  <div className="relative shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;

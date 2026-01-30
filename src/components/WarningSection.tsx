import { AlertTriangle } from "lucide-react";
import userDisabledImg from "@/assets/user-disabled-card.png";
import extensionsMethodImg from "@/assets/3-extensions-method.png";
import fakeCreditsPanel from "@/assets/fake-credits-panel.png";

const warnings = [
  {
    title: "Comprar créditos de \"revendedores\"",
    subtitle: "CONTA BANIDA",
    description: "Pode facilmente banir permanentemente a sua conta. Não arrisque perder todo seu trabalho por economia.",
    image: userDisabledImg,
  },
  {
    title: "Extensões \"piratas\" ou método das 3 extensões",
    subtitle: "NÃO FUNCIONA",
    description: "Não funcionam mais. Além disso você compra e fica SEM SUPORTE (isso se receber algo).",
    image: extensionsMethodImg,
  },
  {
    title: "Painéis de créditos \"infinitos\"",
    subtitle: "BAN GARANTIDO",
    description: "Adição de créditos fake ou painéis prometendo créditos ilimitados são GOLPE. Sua conta será banida permanentemente.",
    image: fakeCreditsPanel,
  }
];

const WarningSection = () => {
  return (
    <div className="mb-16 sm:mb-20">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm font-medium">Atenção</span>
        </div>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          NÃO SEJA <span className="text-red-400">BOBO!</span>
        </h3>
      </div>

      {/* Warning Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-4xl mx-auto">
        {warnings.map((warning, index) => (
          <div
            key={index}
            className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-card to-card/80 border border-border/50 hover:border-red-500/30 transition-all duration-300"
          >
            {/* Image Container with X overlay */}
            <div className="relative h-36 sm:h-40 overflow-hidden">
              <img 
                src={warning.image} 
                alt={warning.title}
                className="w-full h-full object-cover"
              />
              
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/50" />
              
              {/* X Mark overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* First diagonal line */}
                <div className="absolute w-[140%] h-1 bg-red-500 rotate-45 shadow-lg shadow-red-500/50" />
                {/* Second diagonal line */}
                <div className="absolute w-[140%] h-1 bg-red-500 -rotate-45 shadow-lg shadow-red-500/50" />
              </div>
              
              {/* Subtitle badge */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/90 backdrop-blur-sm">
                  <span className="text-white text-xs font-bold uppercase tracking-wide">
                    {warning.subtitle}
                  </span>
                </div>
              </div>
              
              {/* Gradient fade to content */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-3">
              <h4 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                {warning.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {warning.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarningSection;

import { Download, MessageSquare, Infinity } from "lucide-react";
import zyraExtensionPreview from "@/assets/zyra-extension-preview-new.png";

const steps = [{
  number: "01",
  icon: Download,
  title: "Instale a Extensão",
  description: "Instale a extensão em seu navegador em poucos cliques."
}, {
  number: "02",
  icon: MessageSquare,
  title: "Envie suas Mensagens",
  description: "Envie suas mensagens direto em nosso sistema integrado."
}, {
  number: "03",
  icon: Infinity,
  title: "Acesso Ilimitado",
  description: "Seus créditos não serão gastos, seu acesso é ilimitado à plataforma."
}];

const HowItWorksSection = () => {
  return (
    <section className="relative pt-6 pb-16 md:pt-8 md:pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-radial from-primary/6 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-14">
          {/* Preview Image */}
          <div className="flex justify-center -mb-1">
            <img 
              src={zyraExtensionPreview} 
              alt="Zyra Extension Preview" 
              className="w-44 sm:w-52 md:w-64 h-auto object-contain"
            />
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-foreground mb-3 font-semibold">
            Como <span className="text-gradient">Funciona?</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Configure em menos de 2 minutos e comece a usar
          </p>
        </div>

        {/* Steps - Desktop */}
        <div className="hidden lg:block max-w-5xl mx-auto">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-[52px] left-[calc(16.66%+60px)] right-[calc(16.66%+60px)] h-[2px]">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-accent/40 to-primary/60 rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 blur-sm" />
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative group">
                  {/* Number Circle */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {/* Outer glow ring */}
                      <div className="absolute inset-0 w-[104px] h-[104px] rounded-full bg-gradient-to-br from-primary/40 to-accent/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative w-[104px] h-[104px] rounded-full bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-lg shadow-primary/25 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/40 group-hover:scale-105">
                        <div className="w-[88px] h-[88px] rounded-full bg-card flex items-center justify-center border border-primary/20">
                          <span className="text-2xl font-bold text-gradient">{step.number}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="relative bg-gradient-to-b from-card/90 to-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 transition-all duration-500 group-hover:border-primary/40 group-hover:bg-card/95 overflow-hidden shadow-lg shadow-black/5 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:-translate-y-1">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-accent/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Subtle corner accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/8 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Icon */}
                    <div className="relative flex justify-center mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 flex items-center justify-center transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-primary/25 group-hover:to-accent/15 group-hover:scale-110 group-hover:border-primary/30 shadow-inner shadow-primary/5">
                        <step.icon className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative text-center">
                      <h3 className="text-base font-semibold text-foreground mb-2.5 group-hover:text-primary transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    
                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps - Tablet */}
        <div className="hidden md:block lg:hidden max-w-xl mx-auto">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="group">
                <div className="relative flex items-center gap-4 bg-card/80 border border-border/50 rounded-xl p-4 transition-all duration-300 hover:border-primary/25 hover:bg-card">
                  {/* Number + Icon */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
                      <step.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-md bg-card border border-primary/25 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">{step.number}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps - Mobile */}
        <div className="md:hidden">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-primary/50 via-accent/30 to-primary/50 rounded-full" />

            <div className="space-y-5">
              {steps.map((step, index) => (
                <div key={index} className="relative flex gap-4 group">
                  {/* Node */}
                  <div className="flex-shrink-0 relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex flex-col items-center justify-center shadow-md shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
                      <step.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                      <span className="text-[9px] font-bold text-white/80 mt-0.5">{step.number}</span>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-card/80 border border-border/50 rounded-xl p-4 transition-all duration-300 group-hover:border-primary/25 group-hover:bg-card">
                    <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

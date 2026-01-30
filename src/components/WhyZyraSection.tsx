import { CreditCard, Shield, RefreshCcw } from "lucide-react";

const benefits = [
  {
    icon: CreditCard,
    title: "Sem gastos de créditos",
    description: "Economize enquanto cria"
  },
  {
    icon: Shield,
    title: "Sem risco de BAN",
    description: "100% seguro para sua conta"
  },
  {
    icon: RefreshCcw,
    title: "Método sempre atualizado",
    description: "Acompanhamos as mudanças"
  }
];

const WhyZyraSection = () => {
  return (
    <div className="mb-16 sm:mb-20">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-12">
        <span className="inline-block text-primary text-sm font-medium uppercase tracking-wider mb-2">
          A escolha certa
        </span>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Por que usar a <span className="text-gradient">Zyra Pro</span>?
        </h3>
      </div>

      {/* Benefits Path - Desktop (2 columns with connecting path) */}
      <div className="hidden md:block max-w-3xl mx-auto relative">
        {/* Central vertical line */}
        <div className="absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50 -translate-x-1/2" />
        
        {/* Benefits in alternating layout */}
        <div className="space-y-0">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const isLeft = index % 2 === 0;
            
            return (
              <div key={index} className="relative flex items-center">
                {/* Left card */}
                {isLeft ? (
                  <>
                    <div className="w-[calc(50%-32px)] pr-4">
                      <div className="group p-5 rounded-2xl bg-card/80 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-foreground mb-1">{benefit.title}</h4>
                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connecting line and dot */}
                    <div className="relative flex items-center justify-center w-16">
                      <div className="absolute w-8 h-px bg-primary/40 -left-0" />
                      <div className="w-4 h-4 rounded-full bg-primary border-4 border-background z-10 shadow-lg shadow-primary/30" />
                    </div>
                    
                    <div className="w-[calc(50%-32px)]" />
                  </>
                ) : (
                  <>
                    <div className="w-[calc(50%-32px)]" />
                    
                    {/* Connecting line and dot */}
                    <div className="relative flex items-center justify-center w-16">
                      <div className="absolute w-8 h-px bg-accent/40 right-0" />
                      <div className="w-4 h-4 rounded-full bg-accent border-4 border-background z-10 shadow-lg shadow-accent/30" />
                    </div>
                    
                    {/* Right card */}
                    <div className="w-[calc(50%-32px)] pl-4">
                      <div className="group p-5 rounded-2xl bg-card/80 border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                            <Icon className="w-5 h-5 text-accent" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-foreground mb-1">{benefit.title}</h4>
                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Path - Mobile (vertical timeline) */}
      <div className="md:hidden max-w-sm mx-auto relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-4 bottom-4 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50" />
        
        <div className="space-y-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const isPrimary = index % 2 === 0;
            
            return (
              <div key={index} className="relative flex items-start gap-4 pl-12">
                {/* Dot on the line */}
                <div 
                  className={`absolute left-3 top-5 w-4 h-4 rounded-full border-4 border-background z-10 shadow-lg ${
                    isPrimary ? 'bg-primary shadow-primary/30' : 'bg-accent shadow-accent/30'
                  }`} 
                />
                
                {/* Card */}
                <div 
                  className={`flex-1 group p-4 rounded-xl bg-card/80 border transition-all duration-300 ${
                    isPrimary 
                      ? 'border-primary/20 hover:border-primary/40' 
                      : 'border-accent/20 hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                        isPrimary 
                          ? 'bg-primary/10 border border-primary/20 group-hover:bg-primary/20' 
                          : 'bg-accent/10 border border-accent/20 group-hover:bg-accent/20'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isPrimary ? 'text-primary' : 'text-accent'}`} />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h4 className="text-sm font-semibold text-foreground mb-0.5">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WhyZyraSection;

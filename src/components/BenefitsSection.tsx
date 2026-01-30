import { User, Smartphone, DollarSign, Clock } from "lucide-react";

const benefits = [
  {
    icon: User,
    text: "Quer usar Lovable, V0 e Bolt sem depender de créditos pagos"
  },
  {
    icon: Smartphone,
    text: "Prefere um método simples, sem complicação"
  },
  {
    icon: DollarSign,
    text: "Quer criar projetos sem gastar com mensalidade"
  },
  {
    icon: Clock,
    text: "Valoriza conteúdo direto e rápido de aplicar"
  }
];

const BenefitsSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-secondary/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-10 lg:mb-12">
          Isso é pra você se...
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 max-w-3xl mx-auto">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="card-premium rounded-xl p-4 sm:p-5 lg:p-6 flex items-start gap-3 sm:gap-4"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
              </div>
              <p className="text-sm sm:text-base lg:text-lg font-medium leading-relaxed">{benefit.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;

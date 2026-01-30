import { Quote } from "lucide-react";

const testimonials = [
  {
    text: "Finalmente consegui usar o Lovable sem me preocupar com créditos. O método é simples e funciona!",
    author: "Maria S."
  },
  {
    text: "Em menos de 10 minutos já estava aplicando. Melhor investimento que fiz esse ano.",
    author: "João P."
  },
  {
    text: "O grupo VIP é incrível, sempre tem dicas novas e suporte rápido.",
    author: "Ana C."
  }
];

const SocialProofSection = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 sm:p-8 mb-10">
          <p className="text-center text-primary-foreground font-bold text-lg sm:text-xl">
            +500 pessoas já usam o método
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className="card-premium rounded-xl p-5 space-y-3">
              <Quote className="w-6 h-6 text-primary/40" />
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
              <p className="text-xs font-semibold text-primary">{t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;

import { Users, ArrowRight } from "lucide-react";
import networkingGroupChat from "@/assets/networking-group-chat.png";

const NetworkingCard = () => {
  return (
    <div className="mt-16 md:mt-24">
      <div className="max-w-md mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest mb-3">
            <Users className="w-4 h-4" />
            Comunidade Exclusiva
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
            Grupo de <span className="text-gradient">Networking</span>
          </h3>
        </div>

        {/* Image */}
        <div className="relative max-w-[85%] mx-auto">
          {/* Outer glow */}
          <div 
            className="absolute -inset-4 rounded-2xl opacity-30 blur-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(252 85% 67% / 0.5) 0%, hsl(254 89% 78% / 0.3) 100%)',
            }}
          />
          
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img 
              src={networkingGroupChat} 
              alt="Grupo Networking / Ads.sand" 
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            Acesso incluído na sua licença
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetworkingCard;

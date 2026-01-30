import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import zyraProLogoHero from "@/assets/zyra-pro-logo-hero.png";
import WistiaVideo from "@/components/WistiaVideo";

const HeroSection = () => {
  const scrollToPricing = () => {
    document.getElementById("pricing-card")?.scrollIntoView({
      behavior: "smooth"
    });
  };
  return <section className="sm:pt-16 sm:pb-20 relative overflow-hidden py-[25px] pt-[55px] pb-[20px]">
      <div className="container relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-7">

          {/* Zyra Pro Logo */}
          <div className="flex justify-center">
            <img src={zyraProLogoHero} alt="Zyra Pro" className="h-8 sm:h-10 w-auto" />
          </div>

          {/* Headline */}
          <h1 className="sm:text-4xl md:text-5xl leading-[1.15] tracking-tight font-semibold text-3xl">
            Use o Lovable, V0 e<br />Manus <span className="text-gradient">INFINITOS</span> sem<br />pagar por créditos.
          </h1>

          {/* Subheadline */}
          <p className="text-muted-foreground text-sm sm:text-base font-light max-w-lg mx-auto">
            Está 100% funcional e você tem garantia plena de 7 dias. É de fato <strong className="text-foreground font-medium">todas IAs infinitas</strong>, sem limites ou restrições de uso.
          </p>

          {/* Video */}
          <div className="card-premium rounded-2xl overflow-hidden max-w-[500px] mx-auto">
            <WistiaVideo key="hero-video-4-3" aspectRatio="4:3" mediaId="j5vsiet2uy" />
          </div>

          {/* CTA Button */}
          <Button
            onClick={scrollToPricing}
            className="w-full max-w-[290px] h-12 text-sm font-semibold text-white rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #8065f3 0%, #6d4ed8 50%, #9b7bf7 100%)',
              boxShadow: '0 8px 32px rgba(128, 101, 243, 0.4)',
            }}
          >
            <ShoppingCart className="mr-2 w-4 h-4" />
            QUERO MEU ACESSO!
          </Button>
        </div>
      </div>
    </section>;
};
export default HeroSection;
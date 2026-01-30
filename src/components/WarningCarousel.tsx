import { AlertTriangle } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import userDisabledImg from "@/assets/user-disabled-card.png";
import extensionsMethodImg from "@/assets/3-extensions-method.png";
import fakeCreditsPanel from "@/assets/fake-credits-panel.png";

const warnings = [
  {
    title: "Comprar créditos de \"revendedores\"",
    subtitle: "CONTA BANIDA",
    description: "Pode banir permanentemente sua conta.",
    image: userDisabledImg,
  },
  {
    title: "Extensões \"piratas\"",
    subtitle: "NÃO FUNCIONA",
    description: "Não funcionam mais e você fica sem suporte.",
    image: extensionsMethodImg,
  },
  {
    title: "Painéis de créditos \"infinitos\"",
    subtitle: "BAN GARANTIDO",
    description: "São golpes. Sua conta será banida.",
    image: fakeCreditsPanel,
  }
];

const WarningCarousel = () => {
  return (
    <div className="max-w-xl mx-auto mt-12 md:mt-16">
      {/* Compact Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-semibold text-foreground">
          NÃO SEJA <span className="text-red-400">BOBO!</span>
        </span>
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: "center",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 3500,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {warnings.map((warning, index) => (
            <CarouselItem key={index} className="pl-2 basis-[85%] sm:basis-[70%]">
              <div className="relative rounded-xl overflow-hidden bg-card/50 border border-red-500/20">
                <div className="flex items-stretch">
                  {/* Image Side */}
                  <div className="relative w-24 sm:w-28 flex-shrink-0">
                    <img 
                      src={warning.image} 
                      alt={warning.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    {/* X Mark */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-[120%] h-0.5 bg-red-500 rotate-45" />
                      <div className="absolute w-[120%] h-0.5 bg-red-500 -rotate-45" />
                    </div>
                  </div>
                  
                  {/* Content Side */}
                  <div className="flex-1 p-3 sm:p-4">
                    <div className="inline-flex items-center px-2 py-0.5 rounded bg-red-500/20 mb-2">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">
                        {warning.subtitle}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-medium text-foreground leading-tight mb-1">
                      {warning.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                      {warning.description}
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {warnings.map((_, idx) => (
          <div 
            key={idx} 
            className="w-1.5 h-1.5 rounded-full bg-red-400/40"
          />
        ))}
      </div>
    </div>
  );
};

export default WarningCarousel;

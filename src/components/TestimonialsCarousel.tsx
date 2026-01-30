import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import testimonial1 from "@/assets/testimonial-1.jpeg";
import testimonial2 from "@/assets/testimonial-2.jpeg";
import testimonial3 from "@/assets/testimonial-3.jpeg";
import testimonial4 from "@/assets/testimonial-4.jpeg";
import testimonial5 from "@/assets/testimonial-5.jpeg";

const testimonials = [
  { id: 1, image: testimonial1, name: "Paulo" },
  { id: 2, image: testimonial2, name: "William" },
  { id: 3, image: testimonial3, name: "Bruno" },
  { id: 4, image: testimonial4, name: "Denilson" },
  { id: 5, image: testimonial5, name: "Felipe" },
];

const TestimonialsCarousel = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "center",
      skipSnaps: false,
      dragFree: false,
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  return (
    <div className="mb-16 sm:mb-20">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <span className="inline-flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-wider mb-2">
          <MessageCircle className="w-4 h-4" />
          Depoimentos reais
        </span>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          O que nossos <span className="text-gradient">clientes</span> dizem
        </h3>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Conversas reais de pessoas que já usam a Zyra Pro
        </p>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={cn(
                "flex-shrink-0 px-2 transition-all duration-300",
                "basis-[75%] sm:basis-[50%] md:basis-[35%] lg:basis-[28%]"
              )}
            >
              {/* Gradient border wrapper */}
              <div
                className={cn(
                  "relative rounded-2xl p-[3px] transition-all duration-300 transform",
                  index === selectedIndex
                    ? "shadow-xl shadow-primary/20 scale-100"
                    : "opacity-60 scale-95"
                )}
                style={{
                  background: index === selectedIndex 
                    ? "linear-gradient(135deg, #9b7bf7 0%, #8065f3 50%, #6d4ed8 100%)"
                    : "linear-gradient(135deg, rgba(128,101,243,0.3) 0%, rgba(109,78,216,0.2) 100%)"
                }}
              >
                <div className="relative rounded-[13px] overflow-hidden bg-background">
                  <img
                    src={testimonial.image}
                    alt={`Depoimento de ${testimonial.name}`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Name badge */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/90 text-white text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {testimonial.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "bg-primary w-6"
                : "bg-primary/30 hover:bg-primary/50 w-2"
            )}
            aria-label={`Ir para depoimento ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialsCarousel;

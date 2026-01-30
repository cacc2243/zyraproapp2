import { useEffect, useState, useCallback } from "react";
import { Infinity, ChevronLeft, ChevronRight } from "lucide-react";
import credits1 from "@/assets/credits-1.png";
import credits2 from "@/assets/credits-2.png";
import credits3 from "@/assets/credits-3.png";
import credits4 from "@/assets/credits-4.png";
import credits5 from "@/assets/credits-5.png";
import credits6 from "@/assets/credits-6.png";
import credits7 from "@/assets/credits-7.png";
import credits8 from "@/assets/credits-8.png";
import credits9 from "@/assets/credits-9.png";
import credits10 from "@/assets/credits-10.png";
const creditsImages = [credits1, credits2, credits3, credits4, credits5, credits6, credits7, credits8, credits9, credits10];
const InfiniteCreditsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % creditsImages.length);
  }, []);
  
  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + creditsImages.length) % creditsImages.length);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="hidden sm:block h-[2px] w-8 lg:w-12 bg-gradient-to-r from-transparent to-primary/50" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-primary via-pink-400 to-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse flex-shrink-0">
                <Infinity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-8 lg:h-8 text-white" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black bg-gradient-to-r from-primary via-pink-400 to-primary bg-clip-text text-transparent">
                É CRÉDITO INFINITO!
              </p>
            </div>
            <div className="hidden sm:block h-[2px] w-8 lg:w-12 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-4xl lg:max-w-5xl mx-auto">
          {/* Glow effect behind carousel */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 blur-2xl" />
          
          {/* Carousel viewport */}
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl">
            <div 
              className="flex transition-transform duration-500 ease-out" 
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {creditsImages.map((img, i) => (
                <div key={i} className="flex-shrink-0 w-full">
                  <img 
                    src={img} 
                    alt={`Créditos Infinitos ${i + 1}`} 
                    className="w-full h-auto object-cover rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl shadow-primary/20" 
                  />
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            <button 
              onClick={prevSlide} 
              className="absolute left-1 sm:left-2 lg:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-background/90 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-lg z-10" 
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>
            <button 
              onClick={nextSlide} 
              className="absolute right-1 sm:right-2 lg:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-background/90 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-lg z-10" 
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
            {creditsImages.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentIndex(i)} 
                className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                  i === currentIndex 
                    ? "bg-primary w-6 sm:w-8" 
                    : "bg-primary/30 hover:bg-primary/50 w-2 sm:w-2.5"
                }`} 
                aria-label={`Ir para imagem ${i + 1}`} 
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default InfiniteCreditsSection;
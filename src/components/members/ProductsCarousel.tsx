import { motion } from "framer-motion";
import { Sparkles, Crown, Zap, ExternalLink, Check, ShoppingBag, Stars } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import extLovableIcon from "@/assets/ext-lovable-icon.png";
import metodologiaLovableIcon from "@/assets/metodo-lovable-logo.png";

interface Product {
  id: string;
  name: string;
  description: string;
  icon: string;
  originalPrice: number;
  price: number;
  badge?: string;
  badgeColor?: "emerald" | "primary" | "amber";
  features: string[];
  isMethod?: boolean;
}

const products: Product[] = [
  {
    id: "metodo-google-ai-ultra",
    name: "Método Google AI Ultra",
    description: "Tenha acesso ILIMITADO ao VEO 3.1, Flow & Whisk, Gemini 2.5 Pro, Nano Banana Pro e muito mais!",
    icon: "google-ai",
    originalPrice: 19700,
    price: 4790,
    badge: "Novo",
    badgeColor: "amber",
    features: ["45.000 créditos (infinito)", "VEO 3.1 & Flow & Whisk", "Gemini 2.5 Pro"],
    isMethod: true,
  },
  {
    id: "metodo-conta-pro",
    name: "Método Conta PRO",
    description: "Crie contas PRO no Lovable sem custos mensais recorrentes.",
    icon: metodologiaLovableIcon,
    originalPrice: 7990,
    price: 3990,
    badge: "Funcional",
    badgeColor: "emerald",
    features: ["Passo a passo completo", "Suporte no grupo", "Acesso vitalício"],
    isMethod: true,
  },
];

const formatPrice = (priceInCents: number) => {
  return (priceInCents / 100).toFixed(2).replace(".", ",");
};

const ProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (product.isMethod) {
      // For method product, redirect to external checkout or specific page
      navigate(`/checkout?product=${product.id}&price=${product.price}&originalPrice=${product.originalPrice}`);
    } else {
      // For extensions, redirect to checkout with proper params
      navigate(`/checkout?product=${product.id}&price=${product.price}&originalPrice=${product.originalPrice}`);
    }
  };

  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1625]/90 via-[#1e1833]/95 to-[#1a1625]/90 backdrop-blur-xl h-full flex flex-col"
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-1/2 h-24 bg-accent/5 blur-3xl pointer-events-none" />

      {/* Discount Badge - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <span className="text-[11px] font-bold text-emerald-400">
            -{discountPercent}%
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 flex flex-col h-full">
        {/* Header - Icon + Badge */}
        <div className="flex items-start gap-4 mb-4">
          {/* Product Icon */}
          <div className="relative">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 flex items-center justify-center p-3 shadow-xl">
              {product.icon === "google-ai" ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 rounded-xl">
                  <Stars className="w-8 h-8 text-white" />
                </div>
              ) : (
                <img src={product.icon} alt={product.name} className="w-full h-full object-contain" />
              )}
            </div>
            {/* Glow under icon */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-primary/20 blur-xl" />
          </div>
          
          {/* Badge */}
          {product.badge && (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              product.badgeColor === 'emerald' 
                ? 'bg-emerald-500/15 border-emerald-500/25' 
                : product.badgeColor === 'amber'
                ? 'bg-amber-500/15 border-amber-500/25'
                : 'bg-primary/15 border-primary/25'
            }`}>
              {product.badgeColor === 'amber' ? (
                <Zap className="w-3 h-3 text-amber-400" />
              ) : product.isMethod ? (
                <Crown className={`w-3 h-3 ${product.badgeColor === 'emerald' ? 'text-emerald-400' : 'text-primary'}`} />
              ) : (
                <Sparkles className="w-3 h-3 text-primary" />
              )}
              <span className={`text-[10px] font-medium tracking-wide uppercase ${
                product.badgeColor === 'emerald' ? 'text-emerald-400' 
                : product.badgeColor === 'amber' ? 'text-amber-400'
                : 'text-primary'
              }`}>
                {product.badge}
              </span>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 leading-tight">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-2 mb-5 flex-grow">
          {product.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="mb-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground/60 line-through">
              R$ {formatPrice(product.originalPrice)}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">
              R$ {formatPrice(product.price)}
            </span>
            <span className="text-[10px] text-muted-foreground">/ vitalício</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleClick}
          className="w-full gap-2 py-5 bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 font-medium"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-sm">Comprar Agora</span>
        </Button>
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </motion.div>
  );
};

const ProductsCarousel = () => {
  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 shadow-lg shadow-primary/10">
          <ShoppingBag className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-foreground">Mais Produtos</h2>
          <p className="text-[11px] text-muted-foreground">Expanda suas possibilidades</p>
        </div>
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem key={product.id} className="pl-4 basis-[88%] sm:basis-[75%] md:basis-[55%] lg:basis-[48%]">
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-4 bg-background/80 border-primary/30 hover:bg-primary/20 hover:border-primary/50 shadow-lg" />
        <CarouselNext className="hidden sm:flex -right-4 bg-background/80 border-primary/30 hover:bg-primary/20 hover:border-primary/50 shadow-lg" />
      </Carousel>

      {/* Mobile Swipe Indicator */}
      <div className="sm:hidden flex items-center justify-center gap-2 mt-4">
        <div className="flex items-center gap-1">
          <div className="w-6 h-1.5 rounded-full bg-primary/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
        <span className="text-[10px] text-muted-foreground ml-2">Deslize para ver mais</span>
      </div>
    </div>
  );
};

export default ProductsCarousel;
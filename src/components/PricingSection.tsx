import { ShoppingCart, Check, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HowItWorksSection from "./HowItWorksSection";
import WhyZyraSection from "./WhyZyraSection";
import TestimonialsCarousel from "./TestimonialsCarousel";




import icoLov from "@/assets/ico-lov.png";
import icoV0 from "@/assets/ico-v0.png";
import icoManus from "@/assets/ico-manus.png";
import zyraProLogo from "@/assets/zyra-pro-logo.png";

// Unified pricing - All 3 AIs included
const pricing = {
  monthly: { price: 9700, originalPrice: 19700 },
  yearly: { price: 29700, originalPrice: 59700 },
};

type PlanType = "monthly" | "yearly";

const planLabels: Record<PlanType, { label: string; period: string; savings?: string }> = {
  monthly: { label: "Mensal", period: "/mês" },
  yearly: { label: "Anual", period: "/ano", savings: "Economia de R$ 867" },
};

const formatPrice = (cents: number) => {
  return (cents / 100).toFixed(2).replace(".", ",");
};

const PricingSection = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");

  const currentPricing = pricing[selectedPlan];
  const discountPercent = Math.round(
    ((currentPricing.originalPrice - currentPricing.price) / currentPricing.originalPrice) * 100
  );

  const handleCheckout = () => {
    navigate(`/checkout?plan=${selectedPlan}`);
  };

  return (
    <section id="pricing" className="relative overflow-hidden py-16 md:py-24">
      <div className="container relative z-10 px-4 sm:px-6">
        {/* How It Works Section */}
        <HowItWorksSection />
        
        {/* Why Zyra Section */}
        <WhyZyraSection />

        {/* Testimonials Carousel */}
        <TestimonialsCarousel />



        <div id="pricing-card" className="relative mt-16 md:mt-24">
          {/* Top Light Blur Effect */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[700px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, hsl(252 85% 67% / 0.2) 0%, hsl(254 89% 78% / 0.08) 40%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          
          {/* Section Header */}
          <div className="text-center mb-10 md:mb-14 relative">
            <span className="inline-flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest mb-4">
              <Sparkles className="w-4 h-4" />
              Zyra PRO
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground">
              Escolha seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Plano</span>
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              Acesso completo às 3 extensões em um único plano
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto relative">
            <div className="relative">
              {/* Outer glow */}
              <div 
                className="absolute -inset-1 rounded-3xl opacity-50 blur-xl"
                style={{
                  background: 'linear-gradient(135deg, hsl(252 85% 67% / 0.4) 0%, hsl(254 89% 78% / 0.2) 100%)',
                }}
              />
              
              {/* Card with gradient border */}
              <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-primary/50 via-primary/20 to-accent/10">
                <div className="relative bg-gradient-to-b from-card via-card to-background rounded-3xl p-6 sm:p-8 overflow-hidden">
                  
                  {/* Ambient gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
                  
                  {/* Content */}
                  <div className="relative">
                    {/* Product Header - Zyra PRO Logo */}
                    <div className="flex flex-col items-center mb-6">
                      <img src={zyraProLogo} alt="Zyra PRO" className="h-12 object-contain mb-2" />
                      <p className="text-xs text-muted-foreground">Lovable + V0.dev + Manus AI</p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-6" />

                    {/* Included Extensions */}
                    <div className="mb-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 text-center">
                        Extensões Incluídas
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: "Lovable", icon: icoLov },
                          { name: "V0.dev", icon: icoV0 },
                          { name: "Manus AI", icon: icoManus },
                        ].map((ext, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2 p-3 bg-background/40 border border-border/50 rounded-xl">
                            <img src={ext.icon} alt={ext.name} className="w-8 h-8 object-contain" />
                            <span className="text-[10px] text-foreground/80 font-medium">{ext.name}</span>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {["Uso Ilimitado", "Suporte + Updates", "Área de Membros", "Grupo VIP"].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-background/40 border border-border/50 rounded-lg px-3 py-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-xs text-foreground/80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Plan Selector - Compact tabs */}
                    <div className="flex justify-center mb-4">
                      <div className="inline-flex bg-background/60 border border-border/50 rounded-full p-1">
                        {(["monthly", "yearly"] as PlanType[]).map((plan) => {
                          const isSelected = selectedPlan === plan;
                          const planInfo = planLabels[plan];
                          const isAnnual = plan === "yearly";
                          
                          return (
                            <button
                              key={plan}
                              onClick={() => setSelectedPlan(plan)}
                              className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {planInfo.label}
                              {isAnnual && (
                                <span className="absolute -top-2 -right-2 text-[8px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                                  -75%
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price Display */}
                    <div className="text-center mb-6">
                      <p className="text-sm text-muted-foreground line-through mb-1">
                        R$ {formatPrice(currentPricing.originalPrice)}
                      </p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-sm text-muted-foreground mr-1">por</span>
                        <span className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                          R$ {formatPrice(currentPricing.price)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                          {planLabels[selectedPlan].period}
                        </span>
                      </div>
                      <div className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <span className="text-xs font-bold text-emerald-400">
                          Economia de {discountPercent}%
                        </span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={handleCheckout}
                      className="w-full h-14 text-base font-semibold text-white rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
                      style={{
                        background: 'linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(142 71% 45%) 100%)',
                        boxShadow: '0 8px 32px hsl(142 76% 36% / 0.35)',
                      }}
                    >
                      <ShoppingCart className="mr-2 w-5 h-5" />
                      QUERO MEU ACESSO!
                    </Button>

                    {/* Trust Badge */}
                    <div className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary/70" />
                      <span>Garantia de 7 dias • Compra 100% segura</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PricingSection;

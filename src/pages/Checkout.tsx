import { ArrowLeft, Copy, Check, ShieldCheck, Clock, ShoppingCart, QrCode, CheckCircle, Loader2, Pencil, Plus, Zap, Smartphone, User, AlertCircle, Sparkles, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback, useLayoutEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

// Scroll to top on mount
const useScrollToTop = () => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
};
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import CinematicBackground from "@/components/CinematicBackground";
import PaymentConfirmedScreen from "@/components/PaymentConfirmedScreen";
import { useOverflowDebug } from "@/hooks/use-overflow-debug";
import zyraProLogo from "@/assets/zyra-pro-logo.png";
import zyraCheckoutPreview from "@/assets/checkout-banner.png";
import zyraLogoIcon from "@/assets/zyra-logo-icon.png";
import zyraProFullLogo from "@/assets/zyra-pro-full-logo.png";
import zyraProLogoWhite from "@/assets/zyra-pro-logo-white.png";
import googleAiIcon from "@/assets/google-ai-icon.png";
import v0IconWhite from "@/assets/v0-icon-white.png";
import lovableColorIcon from "@/assets/lovable-color-icon.png";
import manusIcon from "@/assets/ico-manus-2.png";
import icoLov2 from "@/assets/ico-lov-2.png";
import icoLov from "@/assets/ico-lov.png";
import icoV0 from "@/assets/ico-v0.png";
import icoManus from "@/assets/ico-manus.png";
import { trackInitiateCheckout, trackPixGerado, trackPurchase, setAdvancedMatching } from "@/hooks/useFacebookPixel";
const features = [{
  text: "1 Ativação de Licença"
}, {
  text: "Acesso a Área de Membros"
}, {
  text: "Grupo VIP Networking"
}, {
  text: "Suporte Direto e Rápido"
}, {
  text: "Todas atualizações"
}];
// Order bumps configuration - different bumps for different products
const allOrderBumps: Record<string, {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  badge?: string;
  badgeColor?: 'primary' | 'amber' | 'blue';
}[]> = {
  // For V0 and Manus products: show Método Conta PRO and Google AI Ultra
  v0: [
    {
      id: 'metodo-conta-pro',
      name: 'Método Conta PRO Lovable',
      subtitle: 'Acesso Vitalício',
      description: 'Aprenda a criar contas PRO no Lovable sem custos mensais recorrentes.',
      price: 3990,
      originalPrice: 7990,
      image: '',
      badge: 'Desconto exclusivo apenas aqui.',
      badgeColor: 'primary'
    },
    {
      id: 'metodo-google-ai-ultra',
      name: 'Método Google AI Ultra',
      subtitle: '45.000 Créditos',
      description: 'Tenha acesso ILIMITADO ao VEO 3.1, Gemini 2.5 Pro, Flow & Whisk e mais!',
      price: 4790,
      originalPrice: 19700,
      image: '',
      badge: 'Desconto exclusivo apenas aqui.',
      badgeColor: 'amber'
    }
  ],
  manus: [
    {
      id: 'metodo-conta-pro',
      name: 'Método Conta PRO Lovable',
      subtitle: 'Acesso Vitalício',
      description: 'Aprenda a criar contas PRO no Lovable sem custos mensais recorrentes.',
      price: 3990,
      originalPrice: 7990,
      image: '',
      badge: 'Desconto exclusivo apenas aqui.',
      badgeColor: 'primary'
    },
    {
      id: 'metodo-google-ai-ultra',
      name: 'Método Google AI Ultra',
      subtitle: '45.000 Créditos',
      description: 'Tenha acesso ILIMITADO ao VEO 3.1, Gemini 2.5 Pro, Flow & Whisk e mais!',
      price: 4790,
      originalPrice: 19700,
      image: '',
      badge: 'Desconto exclusivo apenas aqui.',
      badgeColor: 'amber'
    }
  ],
  // For Zyra PRO (lovable unified plan): show Método Conta PRO and Google AI Ultra
  lovable: [
    {
      id: 'metodo-conta-pro',
      name: 'Método Conta PRO Lovable',
      subtitle: 'Acesso Vitalício',
      description: 'Aprenda a criar contas PRO no Lovable sem custos mensais recorrentes.',
      price: 2990,
      originalPrice: 7990,
      image: '',
      badge: 'Desconto exclusivo apenas aqui.',
      badgeColor: 'primary'
    },
    {
      id: 'metodo-google-ai-ultra',
      name: 'Método Google AI Ultra',
      subtitle: '45.000 Créditos',
      description: 'Tenha acesso ILIMITADO ao VEO 3.1, Gemini 2.5 Pro, Flow & Whisk e mais!',
      price: 2990,
      originalPrice: 19700,
      image: '',
      badge: 'Desconto exclusivo apenas aqui.',
      badgeColor: 'amber'
    }
  ],
  // Default (for method products) - no bumps
  default: []
};
interface PixData {
  pix_code: string;
  payment_url: string;
  transaction_id: string;
}
interface PaymentStatus {
  is_paid: boolean;
  customer: {
    name: string;
    email: string;
    phone: string;
    document: string;
  };
  amount: number;
  fbp?: string;
  fbc?: string;
  transaction_id: string;
}
// Unified pricing - All 3 AIs included in one plan
const subscriptionPricing = {
  monthly: { price: 9700, originalPrice: 19700 },
  yearly: { price: 29700, originalPrice: 59700 },
};

type PlanType = 'monthly' | 'yearly';

const planLabels: Record<PlanType, { label: string; period: string; savings?: string }> = {
  monthly: { label: 'Mensal', period: '/mês' },
  yearly: { label: 'Anual', period: '/ano', savings: 'Economia de R$ 867' },
};

// Product configuration - Unified plan with all 3 AIs
const productConfig = {
  name: 'Zyra PRO',
  title: 'Zyra PRO',
  type: 'extension' as const,
  icon: 'zyra',
  subtitle: 'Lovable + V0.dev + Manus',
};

const Checkout = () => {
  useScrollToTop();
  const [searchParams] = useSearchParams();
  const debugOverflow = import.meta.env.DEV && searchParams.get("debugOverflow") === "1";
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [selectedBumps, setSelectedBumps] = useState<string[]>([]);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editingEmail, setEditingEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const {
    toast
  } = useToast();

  // Confetti effect
  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#a855f7', '#c084fc', '#d946ef', '#ec4899', '#f472b6']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#a855f7', '#c084fc', '#d946ef', '#ec4899', '#f472b6']
      });
    }, 250);
  }, []);

  // Get plan from URL params
  const urlPlan = searchParams.get('plan') as PlanType | null;
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    urlPlan === 'yearly' ? 'yearly' : 'monthly'
  );
  
  const isSubscription = true;

  // DEV: helps pinpoint the exact node causing horizontal overflow on mobile
  useOverflowDebug(debugOverflow);
  
  // Calculate prices based on selected plan
  const getBasePrice = () => {
    return subscriptionPricing[selectedPlan]?.price || 9700;
  };
  
  const getBaseOriginalPrice = () => {
    return subscriptionPricing[selectedPlan]?.originalPrice || 19700;
  };
  
  const basePrice = getBasePrice();
  const baseOriginalPrice = getBaseOriginalPrice();
  const productName = productConfig.name;

  // Get order bumps for the unified plan
  const orderBumps = allOrderBumps.lovable || [];

  // Get product icon based on config
  const getProductIcon = () => {
    switch (productConfig.icon) {
      case 'google': return googleAiIcon;
      case 'lovable': return lovableColorIcon;
      case 'v0': return v0IconWhite;
      default: return zyraLogoIcon;
    }
  };
  const productIcon = getProductIcon();

  // Track scroll for header glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track InitiateCheckout on mount (deduped automatically)
  useEffect(() => {
    trackInitiateCheckout(basePrice);
  }, [basePrice]);

  // Payment status polling - check every 3 seconds when PIX is generated
  useEffect(() => {
    if (!pixData?.transaction_id || paymentConfirmed) return;
    const checkPaymentStatus = async () => {
      try {
        setCheckingPayment(true);
        const response = await fetch(`https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/check-payment-status?transaction_id=${encodeURIComponent(pixData.transaction_id)}`);
        const result = await response.json();
        if (result.success && result.data.is_paid) {
          setPaymentConfirmed(true);

          // Fire Facebook Purchase event (deduped automatically by trackPurchase)
          trackPurchase({
            value: result.data.amount,
            transactionId: result.data.transaction_id,
            customerName: result.data.customer.name,
            customerEmail: result.data.customer.email,
            customerPhone: result.data.customer.phone,
            customerDocument: result.data.customer.document
          });
          toast({
            title: "🎉 Pagamento Confirmado!",
            description: "Seu acesso será enviado para o email cadastrado."
          });
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setCheckingPayment(false);
      }
    };

    // Check immediately
    checkPaymentStatus();

    // Then check every 3 seconds
    const intervalId = setInterval(checkPaymentStatus, 3000);

    // Cleanup on unmount or when payment is confirmed
    return () => clearInterval(intervalId);
  }, [pixData?.transaction_id, paymentConfirmed, toast]);
  const calculateTotal = () => {
    let total = basePrice;
    selectedBumps.forEach(bumpId => {
      const bump = orderBumps.find(b => b.id === bumpId);
      if (bump) total += bump.price;
    });
    return total;
  };
  const calculateOriginalTotal = () => {
    let total = baseOriginalPrice;
    selectedBumps.forEach(bumpId => {
      const bump = orderBumps.find(b => b.id === bumpId);
      if (bump) total += bump.originalPrice;
    });
    return total;
  };
  const calculateDiscount = () => {
    return calculateOriginalTotal() - calculateTotal();
  };
  const toggleBump = (bumpId: string) => {
    setSelectedBumps(prev => prev.includes(bumpId) ? prev.filter(id => id !== bumpId) : [...prev, bumpId]);
  };

  // Capture UTM params
  const utmParams = {
    utm_source: searchParams.get('utm_source') || '',
    utm_medium: searchParams.get('utm_medium') || '',
    utm_campaign: searchParams.get('utm_campaign') || '',
    utm_content: searchParams.get('utm_content') || '',
    utm_term: searchParams.get('utm_term') || '',
    src: searchParams.get('src') || ''
  };

  // Get Facebook cookies
  const getFbCookies = () => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    return {
      fbp: cookies['_fbp'] || '',
      fbc: cookies['_fbc'] || ''
    };
  };
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };
  const handleInputChange = (field: string, value: string) => {
    if (field === 'document') {
      value = formatCPF(value);
    } else if (field === 'phone') {
      value = formatPhone(value);
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // CPF validation algorithm
  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    
    // Check for known invalid patterns
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.charAt(9))) return false;
    
    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.charAt(10))) return false;
    
    return true;
  };
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      errors.email = 'Digite um email válido';
    }
    
    const cpfNumbers = formData.document.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      errors.document = 'CPF deve ter 11 dígitos';
    } else if (!validateCPF(formData.document)) {
      errors.document = 'CPF inválido';
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    
    return true;
  };
  const handleGeneratePix = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setShowLoadingModal(true);
    const fbCookies = getFbCookies();
    
    // Set Advanced Matching data for Facebook Pixel
    const nameParts = formData.name.trim().split(' ');
    setAdvancedMatching({
      email: formData.email,
      phone: formData.phone,
      firstName: nameParts[0],
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined,
      externalId: formData.document,
    });
    try {
      const response = await fetch('https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/create-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          customer_document: formData.document,
          amount: calculateTotal(),
          order_bumps: selectedBumps,
          user_agent: navigator.userAgent,
          // Subscription data - all 3 AIs in one plan
          product_type: 'zyra_pro',
          plan_type: selectedPlan,
          is_subscription: true,
          ...utmParams,
          ...fbCookies
        })
      });
      const result = await response.json();
      if (result.success) {
        setPixData({
          pix_code: result.data.pix_code,
          payment_url: result.data.payment_url,
          transaction_id: result.data.transaction_id
        });
        // Scroll to top immediately
        window.scrollTo({ top: 0, behavior: 'instant' });
        // Trigger confetti celebration
        triggerConfetti();
        // Track PixGerado event (deduped automatically by trackPixGerado)
        trackPixGerado(calculateTotal(), result.data.transaction_id);
        // Don't show toast for PIX generated - only show when copied
      } else {
        throw new Error(result.error || 'Erro ao gerar PIX');
      }
    } catch (error) {
      console.error('Error generating PIX:', error);
      toast({
        title: "Erro ao gerar PIX",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowLoadingModal(false);
    }
  };
  const handleCopyPix = () => {
    if (!pixData?.pix_code) return;
    navigator.clipboard.writeText(pixData.pix_code);
    setCopied(true);
    toast({
      title: "✓ Código PIX copiado!",
      description: "Cole no app do seu banco para pagar.",
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 3000);
  };
  const handleEditEmail = () => {
    setEditingEmail(formData.email);
    setIsEditingEmail(true);
  };
  const handleSaveEmail = async () => {
    if (!editingEmail.trim() || !editingEmail.includes('@')) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }
    if (!pixData?.transaction_id) {
      toast({
        title: "Erro",
        description: "Transação não encontrada",
        variant: "destructive"
      });
      return;
    }
    setSavingEmail(true);
    try {
      const response = await fetch('https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_id: pixData.transaction_id,
          new_email: editingEmail,
          original_email: formData.email
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar email');
      }
      setFormData(prev => ({
        ...prev,
        email: editingEmail
      }));
      setIsEditingEmail(false);
      toast({
        title: "Email atualizado!",
        description: "O acesso será enviado para o novo email."
      });
    } catch (error) {
      console.error('Error updating email:', error);
      toast({
        title: "Erro ao atualizar email",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setSavingEmail(false);
    }
  };
  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    setEditingEmail('');
  };
  return <div className="min-h-screen bg-background relative overflow-hidden" style={{ maxWidth: "100vw" }}>
      {/* Cinematic Background - same as Index */}
      <CinematicBackground />
      
      {/* Fixed Top Info Banner */}
      {!pixData && <div className="fixed top-4 left-0 right-0 z-50 py-3">
          <div className="container px-4">
            <div className="max-w-md mx-auto md:max-w-4xl">
              <div className={`border border-primary/20 rounded-xl px-4 py-3 text-center shadow-lg transition-all duration-300 ${
                isScrolled 
                  ? 'bg-card/60 backdrop-blur-xl border-white/10' 
                  : 'bg-card/70'
              }`}>
                <p className="font-medium text-white whitespace-nowrap leading-none text-[clamp(0.72rem,3.2vw,0.95rem)]">
                  Você está adquirindo o plano{" "}
                  <span className="text-primary font-semibold whitespace-nowrap">Zyra PRO {planLabels[selectedPlan].label}</span>
                </p>
              </div>
            </div>
          </div>
        </div>}
      <main
        className={`relative z-10 py-8 sm:py-12 lg:py-16 container px-4 sm:px-6 lg:px-4 xl:px-6 pt-24 lg:pt-28`}
        style={{ maxWidth: '100vw', width: '100%', overflowX: 'clip' }}
      >
        <div className={`${!pixData ? 'max-w-5xl lg:max-w-6xl' : 'max-w-md'} mx-auto`} style={{ width: '100%' }}>

          <div
            className={`grid gap-6 ${!pixData ? 'md:grid-cols-2' : ''}`}
            style={{ width: '100%' }}
          >
            
            {/* Left Column - Order Summary - Hide when PIX is generated */}
            {!pixData && <div className="order-2 md:order-1">
              {/* Premium Order Summary Card */}
              <div className="relative">
                {/* Outer glow */}
                <div className="absolute -inset-1 rounded-3xl opacity-40 blur-xl" style={{
                background: 'linear-gradient(135deg, hsl(252 85% 67% / 0.3) 0%, hsl(254 89% 78% / 0.15) 100%)'
              }} />
                
                <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-primary/40 via-primary/15 to-transparent">
                  <div className="bg-card rounded-3xl overflow-hidden">
                    
                    {/* Header with full logo */}
                    <div className="relative p-6 pb-4 text-center border-b border-white/10">
                      <img src={zyraProFullLogo} alt="Zyra Pro" className="h-10 mx-auto mb-4" />
                      <h2 className="text-white font-normal text-base">Resumo do Pedido</h2>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-6 space-y-5">
                      {/* Base Product - Zyra PRO */}
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                        {/* Zyra Logo */}
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center p-2.5 border border-primary/20 flex-shrink-0">
                          <img src={zyraLogoIcon} alt="Zyra PRO" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                            <h3 className="font-semibold text-white text-base whitespace-nowrap leading-none">Zyra PRO</h3>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium self-start sm:self-auto">3 licenças</span>
                          </div>
                          <p className="text-xs text-white/50 mt-1">
                            Plano {planLabels[selectedPlan].label}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-white/40 line-through">R$ {(baseOriginalPrice / 100).toFixed(2).replace('.', ',')}</p>
                          <p className="text-lg font-bold text-primary whitespace-nowrap">
                            R$ {(basePrice / 100).toFixed(2).replace('.', ',')}
                          </p>
                          <span className="text-[10px] text-white/40">{planLabels[selectedPlan].period}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2.5">
                        {features.map((feature, index) => <div key={index} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm text-white/70">{feature.text}</span>
                          </div>)}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      {/* Selected Order Bumps in Summary */}
                      {selectedBumps.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Adicionais</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">Cobrança única</span>
                          </div>
                          {selectedBumps.map(bumpId => {
                            const bump = orderBumps.find(b => b.id === bumpId);
                            if (!bump) return null;
                            const bumpIcon = bump.id === 'metodo-google-ai-ultra' ? googleAiIcon : lovableColorIcon;
                            const isAmber = bump.badgeColor === 'amber';
                            return (
                              <div key={bumpId} className="flex gap-3 items-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isAmber ? 'bg-amber-500/15' : 'bg-primary/15'
                                }`}>
                                  <img src={bumpIcon} alt={bump.name} className="w-5 h-5 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-white text-xs truncate">{bump.name}</h4>
                                  <p className="text-[10px] text-white/40">{bump.subtitle}</p>
                                </div>
                                <span className={`text-sm font-bold flex-shrink-0 ${isAmber ? 'text-amber-400' : 'text-primary'}`}>
                                  + R$ {(bump.price / 100).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            );
                          })}
                          
                          {/* Subtotal & Discount */}
                          <div className="pt-2 space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/50">Subtotal</span>
                              <span className="text-white/50 line-through">R$ {(calculateOriginalTotal() / 100).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-emerald-400">Desconto</span>
                              <span className="text-emerald-400">- R$ {(calculateDiscount() / 100).toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-white/60">Total</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                            R$ {(calculateTotal() / 100).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      {/* Pay Button in Summary */}
                      <Button 
                        onClick={handleGeneratePix} 
                        disabled={loading} 
                        className="w-full h-12 text-sm font-semibold text-white rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
                        style={{
                          background: 'linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(142 71% 45%) 100%)',
                          boxShadow: '0 8px 32px hsl(142 76% 36% / 0.35)',
                        }}
                      >
                        {loading ? <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Gerando PIX...
                          </> : <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Finalizar Compra
                          </>}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

            </div>}

            {/* Right Column - PIX Payment */}
            <div className={`w-full min-w-0 ${!pixData ? "order-1 md:order-2" : ""}`}>
              {/* Product Preview Image - Hide when PIX is generated */}
              {!pixData && (
                <div className="relative pt-56 mb-6 overflow-visible">
                  {/* Image behind the card - positioned at top */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-0 overflow-visible">
                      <div className="relative">
                        <img src={zyraCheckoutPreview} alt="Zyra Pro Preview" className="w-[310px] max-w-[90vw] h-auto object-contain" />
                        {/* Fade effect at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
                      </div>
                  </div>
                  
                  {/* Product Card - Fully visible in front */}
                  <div className="relative z-10">
                    <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30">
                      <div className="bg-gradient-to-br from-card via-card/95 to-primary/5 backdrop-blur-xl rounded-xl px-4 py-3 flex items-center gap-3">
                        {/* Icon - Zyra logo only */}
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary/20 to-accent/10">
                          <img src={productIcon} alt={productConfig.title} className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm">{productName}</h3>
                          <span className="text-[10px] text-white/60">{productConfig.subtitle}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-xs font-medium text-primary">3 licenças</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Plan Selector Card - Compact, above form */}
              {!pixData && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center bg-card/80 backdrop-blur-sm border border-white/10 rounded-full p-1 gap-1">
                    {(['monthly', 'yearly'] as PlanType[]).map((plan) => {
                      const isSelected = selectedPlan === plan;
                      const pricing = subscriptionPricing[plan];
                      const isAnnual = plan === 'yearly';
                      const priceDisplay = ((pricing?.price || 0) / 100).toFixed(0).replace('.', ',');
                      
                      return (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => setSelectedPlan(plan)}
                          className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-primary text-white shadow-lg shadow-primary/25'
                              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                          }`}
                        >
                          <span>{plan === 'monthly' ? 'Mensal' : 'Anual'}</span>
                          <span className={isSelected ? 'text-white/90' : 'text-white/40'}>•</span>
                          <span className="font-semibold">R$ {priceDisplay}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-card/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden" style={{ maxWidth: '100%' }}>
                <div className="p-4 sm:p-6 overflow-hidden" style={{ maxWidth: '100%' }}>
                {/* Header - Hide when PIX is generated */}
                {!pixData && (
                  <>
                    <p className="text-[10px] text-muted-foreground text-center mb-4">
                      Plano {planLabels[selectedPlan].label.toLowerCase()} • Cancele quando quiser
                    </p>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <h2 className="text-white text-base font-medium">Preencha suas informações:</h2>
                    </div>
                  </>
                )}

                {!pixData ? (/* Customer Form */
                <div className="space-y-4">
                    <div className="relative">
                      <Label htmlFor="name" className={fieldErrors.name ? 'text-red-400' : ''}>Nome completo *</Label>
                      <div className="relative mt-1">
                        <Input 
                          id="name" 
                          placeholder="Seu nome completo" 
                          value={formData.name} 
                          onChange={e => handleInputChange('name', e.target.value)} 
                          className={`h-12 sm:h-14 text-base transition-all bg-white/5 ${
                            fieldErrors.name 
                              ? 'border-red-500 focus:border-red-500 pr-10' 
                              : formData.name.trim() 
                                ? 'border-emerald-500 pr-10' 
                                : 'border-white/10'
                          }`}
                        />
                        {fieldErrors.name ? (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center animate-scale-in">
                            <AlertCircle className="w-3 h-3 text-white" />
                          </div>
                        ) : formData.name.trim() && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center animate-scale-in">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      {fieldErrors.name && (
                        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <Label htmlFor="email" className={fieldErrors.email ? 'text-red-400' : 'text-white/80'}>Email *</Label>
                      <div className="relative mt-1">
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="seu@email.com" 
                          value={formData.email} 
                          onChange={e => handleInputChange('email', e.target.value)} 
                          className={`h-12 sm:h-14 text-base transition-all bg-white/5 ${
                            fieldErrors.email 
                              ? 'border-red-500 focus:border-red-500 pr-10' 
                              : formData.email.includes('@') 
                                ? 'border-emerald-500 pr-10' 
                                : 'border-white/10'
                          }`}
                        />
                        {fieldErrors.email ? (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center animate-scale-in">
                            <AlertCircle className="w-3 h-3 text-white" />
                          </div>
                        ) : formData.email.includes('@') && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center animate-scale-in">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      {fieldErrors.email && (
                        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <Label htmlFor="phone" className="text-white/80">WhatsApp</Label>
                      <div className="relative mt-1">
                        <Input 
                          id="phone" 
                          placeholder="(11) 99999-9999" 
                          value={formData.phone} 
                          onChange={e => handleInputChange('phone', e.target.value)} 
                          className={`h-12 sm:h-14 text-base transition-all bg-white/5 border-white/10 ${
                            formData.phone.replace(/\D/g, '').length >= 10 ? 'border-emerald-500 pr-10' : ''
                          }`}
                        />
                        {formData.phone.replace(/\D/g, '').length >= 10 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center animate-scale-in">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <Label htmlFor="document" className={fieldErrors.document ? 'text-red-400' : 'text-white/80'}>CPF *</Label>
                      <div className="relative mt-1">
                        <Input 
                          id="document" 
                          placeholder="000.000.000-00" 
                          value={formData.document} 
                          onChange={e => handleInputChange('document', e.target.value)} 
                          className={`h-12 sm:h-14 text-base transition-all bg-white/5 ${
                            fieldErrors.document 
                              ? 'border-red-500 focus:border-red-500 pr-10' 
                              : formData.document.replace(/\D/g, '').length === 11 && validateCPF(formData.document)
                                ? 'border-emerald-500 pr-10' 
                                : 'border-white/10'
                          }`}
                        />
                        {fieldErrors.document ? (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center animate-scale-in">
                            <AlertCircle className="w-3 h-3 text-white" />
                          </div>
                        ) : formData.document.replace(/\D/g, '').length === 11 && validateCPF(formData.document) && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center animate-scale-in">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      {fieldErrors.document && (
                        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.document}
                        </p>
                      )}
                    </div>

                    {/* Order Bumps Section */}
                    {orderBumps.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Aproveite a oferta</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                        
                        {orderBumps.map((bump) => {
                          const isSelected = selectedBumps.includes(bump.id);
                          const bumpIcon = bump.id === 'metodo-google-ai-ultra' ? googleAiIcon : lovableColorIcon;
                          const isAmber = bump.badgeColor === 'amber';
                          
                          return (
                            <motion.div
                              key={bump.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedBumps(selectedBumps.filter(id => id !== bump.id));
                                } else {
                                  setSelectedBumps([...selectedBumps, bump.id]);
                                }
                              }}
                              className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
                                isSelected 
                                  ? isAmber
                                    ? 'ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10'
                                    : 'ring-2 ring-primary/50 shadow-lg shadow-primary/10'
                                  : 'ring-1 ring-white/10 hover:ring-white/20'
                              }`}
                            >
                              {/* Gradient background */}
                              <div className={`absolute inset-0 transition-opacity duration-300 ${
                                isSelected ? 'opacity-100' : 'opacity-50'
                              } ${
                                isAmber 
                                  ? 'bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent' 
                                  : 'bg-gradient-to-br from-primary/10 via-accent/5 to-transparent'
                              }`} />
                              
                              {/* Content */}
                              <div className="relative p-4">
                                {/* Top row: Badge + Checkbox */}
                                <div className="flex items-center justify-between mb-3">
                                  {bump.badge && (
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                      isAmber 
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                        : 'bg-primary/20 text-primary border border-primary/30'
                                    }`}>
                                      <Sparkles className="w-3 h-3" />
                                      {bump.badge}
                                    </div>
                                  )}
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? isAmber
                                        ? 'bg-amber-500 border-amber-500'
                                        : 'bg-primary border-primary'
                                      : 'border-white/30 bg-white/5'
                                  }`}>
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                  </div>
                                </div>
                                
                                {/* Main content row */}
                                <div className="flex gap-3">
                                  {/* Icon */}
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                    isAmber 
                                      ? 'bg-amber-500/15 border-amber-500/20' 
                                      : 'bg-primary/15 border-primary/20'
                                  }`}>
                                    <img src={bumpIcon} alt={bump.name} className="w-7 h-7 object-contain" />
                                  </div>
                                  
                                  {/* Text */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-foreground leading-tight">{bump.name}</h4>
                                    <p className={`text-xs font-medium mt-0.5 ${isAmber ? 'text-amber-400/80' : 'text-primary/80'}`}>
                                      {bump.subtitle}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                                      {bump.description}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Price footer */}
                                <div className={`mt-3 pt-3 border-t flex items-center justify-between ${
                                  isAmber ? 'border-amber-500/20' : 'border-primary/20'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground/60 line-through">
                                      R$ {(bump.originalPrice / 100).toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                      isAmber ? 'bg-amber-500/20 text-amber-300' : 'bg-primary/20 text-primary'
                                    }`}>
                                      -{Math.round((1 - bump.price / bump.originalPrice) * 100)}%
                                    </span>
                                  </div>
                                  <span className={`text-lg font-bold ${isAmber ? 'text-amber-400' : 'text-primary'}`}>
                                    + R$ {(bump.price / 100).toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    <Button 
                      onClick={handleGeneratePix} 
                      disabled={loading} 
                      className="w-full h-14 text-base font-semibold text-white rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
                      style={{
                        background: 'linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(142 71% 45%) 100%)',
                        boxShadow: '0 8px 32px hsl(142 76% 36% / 0.35)',
                      }}
                    >
                      {loading ? <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Gerando PIX...
                        </> : <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Finalizar Compra
                        </>}
                    </Button>

                    {/* How It Works - 3 Steps */}
                    <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                      <h3 className="text-sm font-medium text-white text-center">Como Funciona</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">1</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">Finalize seu pagamento</p>
                            <p className="text-xs text-white/50">
                              Pague via PIX e receba confirmação instantânea no seu e-mail.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-accent">2</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-accent">Acesse a área de membros</p>
                            <p className="text-xs text-white/50">
                              Entre na área exclusiva com todos os conteúdos e downloads.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">3</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">Ative sua licença</p>
                            <p className="text-xs text-white/50">
                              Siga o tutorial simples para ativar e usar imediatamente.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>) : paymentConfirmed ? (
                    <PaymentConfirmedScreen email={formData.email} />
                  ) : (/* PIX Payment Display */
                <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                    {/* Logo at top */}
                    <div className="flex justify-center mb-6 w-full">
                      <img src={zyraProLogoWhite} alt="Zyra Pro" className="h-10 max-w-full" />
                    </div>

                    {/* Order Summary */}
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-4 mb-6 overflow-hidden" style={{ maxWidth: '100%' }}>
                      <h3 className="text-sm font-semibold text-foreground mb-3">Resumo do Pedido</h3>
                      
                      {/* Main Product */}
                      <div className="flex gap-3 pb-3 border-b border-border/30 min-w-0">
                        {/* Icon (Zyra only) */}
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
                            <img src={zyraLogoIcon} alt="Zyra PRO" className="w-6 h-6 object-contain" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-xs whitespace-nowrap leading-none">Zyra PRO</h4>
                          <p className="text-[11px] text-muted-foreground truncate">{productConfig.subtitle}</p>
                        </div>
                        <span className="text-xs font-bold text-primary flex-shrink-0">R$ {(basePrice / 100).toFixed(2).replace('.', ',')}</span>
                      </div>

                      {/* Selected Order Bumps */}
                      {selectedBumps.length > 0 && (
                        <div className="py-3 border-b border-border/30 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Adicionais</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">Cobrança única</span>
                          </div>
                          {selectedBumps.map(bumpId => {
                            const bump = orderBumps.find(b => b.id === bumpId);
                            if (!bump) return null;
                            const bumpIcon = bump.id === 'metodo-google-ai-ultra' || bump.id === 'metodo-google-ai' ? googleAiIcon :
                                             bump.id === 'metodo-conta-pro' ? lovableColorIcon :
                                             bump.id === 'licenca-v0' ? v0IconWhite :
                                             bump.id === 'licenca-manus' ? manusIcon :
                                             zyraLogoIcon;
                            const isAmber = bump.badgeColor === 'amber';
                            return (
                              <div key={bumpId} className="flex gap-3 items-center min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isAmber ? 'bg-amber-500/15' : 'bg-gradient-to-br from-primary/20 to-accent/10'
                                }`}>
                                  <img src={bumpIcon} alt={bump.name} className="w-5 h-5 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-foreground text-xs min-w-0 truncate">{bump.name}</h4>
                                  <p className="text-[10px] text-muted-foreground">{bump.subtitle}</p>
                                </div>
                                <span className={`text-xs font-bold flex-shrink-0 ${isAmber ? 'text-amber-400' : 'text-primary'}`}>
                                  + R$ {(bump.price / 100).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-sm font-bold text-foreground">Total</span>
                        <span className="text-lg font-bold text-primary">R$ {(calculateTotal() / 100).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    {/* License Info Card */}
                    <div className="mb-4 p-4 bg-card/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                      <p className="text-xs text-white/60 mb-3 text-center">Sua licença será enviada para:</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-lg overflow-hidden min-w-0">
                          <span className="text-xs text-white/50 flex-shrink-0">Email:</span>
                          <span className="text-sm font-medium text-primary min-w-0 flex-1 text-right truncate">{formData.email}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-lg overflow-hidden min-w-0">
                          <span className="text-xs text-white/50 flex-shrink-0">CPF:</span>
                          <span className="text-sm font-medium text-primary min-w-0 flex-1 text-right truncate">{formData.document}</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Area */}
                    <div className="bg-white rounded-xl p-4 mb-4">
                      <div className="aspect-square max-w-[160px] mx-auto bg-white rounded-lg flex items-center justify-center overflow-hidden relative">
                        {pixData.pix_code ? <>
                            <div className="absolute inset-0 flex items-center justify-center bg-white z-10 transition-opacity duration-300" id="qr-loading">
                              <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.pix_code)}`} alt="QR Code PIX" className="w-full h-full max-w-full" onLoad={e => {
                          const loader = document.getElementById('qr-loading');
                          if (loader) loader.style.opacity = '0';
                          setTimeout(() => {
                            if (loader) loader.style.display = 'none';
                          }, 300);
                        }} />
                          </> : <div className="text-center">
                            <QrCode className="w-24 h-24 text-gray-800 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">QR Code</p>
                          </div>}
                      </div>
                    </div>

                    {/* OR Divider */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-4 text-sm text-muted-foreground">ou copie o código</span>
                      </div>
                    </div>

                    {/* PIX Copy-Paste */}
                    <div className="space-y-4">
                      <div className="bg-muted/50 border border-border/50 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-2">Código PIX Copia e Cola</p>
                        <p className="text-sm text-foreground font-mono truncate">
                          {pixData.pix_code?.substring(0, 40)}...
                        </p>
                      </div>

                      <Button onClick={handleCopyPix} className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-xl shadow-lg shadow-primary/25">
                        {copied ? <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            CÓDIGO COPIADO!
                          </> : <>
                            <Copy className="w-5 h-5 mr-2" />
                            COPIAR CÓDIGO PIX
                          </>}
                      </Button>
                    </div>
                  </div>)}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 text-center">
              <img src={zyraProFullLogo} alt="Zyra Pro" className="h-8 mx-auto mb-4 opacity-70" />
              <p className="text-xs text-muted-foreground mb-2">
                Pagamento 100% seguro • Garantia de 7 dias
              </p>
              <p className="text-xs text-muted-foreground/60">
                © {new Date().getFullYear()} Zyra Pro. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Loading Modal for PIX Generation */}
      <AnimatePresence>
        {showLoadingModal && (
          <Dialog open={showLoadingModal} onOpenChange={() => {}}>
            <DialogContent
              className="!left-4 !right-4 !w-auto !max-w-none !translate-x-0 bg-card/95 backdrop-blur-xl border-primary/20 rounded-3xl [&>button]:hidden sm:!left-[50%] sm:!right-auto sm:!w-full sm:!max-w-sm sm:!translate-x-[-50%]"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <motion.div 
                className="flex flex-col items-center justify-center py-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {/* Animated Loader */}
                <motion.div 
                  className="relative w-24 h-24 mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary" />
                  <motion.div 
                    className="absolute inset-2 rounded-full border-4 border-transparent border-b-accent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>


                <motion.h3 
                  className="text-xl font-semibold text-foreground mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Gerando seu PIX...
                </motion.h3>
                
                <motion.p 
                  className="text-sm text-muted-foreground text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Aguarde enquanto preparamos seu pagamento
                </motion.p>

                {/* Animated dots */}
                <motion.div className="flex gap-1 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>;
};
export default Checkout;
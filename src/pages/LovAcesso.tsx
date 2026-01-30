import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Key, LogOut, ChevronDown, Copy, Check, User, Mail, FileText, Fingerprint, Puzzle, Monitor, Users, MessageCircle, Lock, ShoppingCart, AlertTriangle, Shield, Ban, Share2, Laptop, Eye, Gavel, ServerCrash, UserX, Package, Sparkles, Crown, Zap, Infinity, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Footer from "@/components/Footer";
import CinematicBackground from "@/components/CinematicBackground";
import DownloadExtensionModal from "@/components/DownloadExtensionModal";
import { motion, AnimatePresence } from "framer-motion";
import zyraLogoMembers from "@/assets/zyra-logo-members.png";
import activationStep1 from "@/assets/activation-step-1.png";
import activationStep2 from "@/assets/activation-step-2.png";
import WistiaVideo from "@/components/WistiaVideo";
import ProductsCarousel from "@/components/members/ProductsCarousel";
import FreeSidebar from "@/components/members/FreeSidebar";
import MetodoContaPro from "@/components/members/MetodoContaPro";

// Extension icons
import extLovableIcon from "@/assets/ext-lovable-icon.png";
import extV0Icon from "@/assets/ext-v0-icon.png";
import extManusIcon from "@/assets/ext-manus-icon.png";
import googleAiIcon from "@/assets/google-ai-icon.png";
import lovableColorIcon from "@/assets/lovable-color-icon.png";

type ExtensionType = 'lovable' | 'v0' | 'manus' | null;
type ProductType = 'outros' | null;

// Extension configs - All use primary purple color
const extensions = {
  lovable: {
    id: 'lovable' as const,
    name: 'Lovable',
    description: 'Extensão para Lovable.dev',
    icon: extLovableIcon,
    isPurchased: true,
    price: 9700,
    originalPrice: 19700,
  },
  v0: {
    id: 'v0' as const,
    name: 'V0.dev',
    description: 'Extensão para V0.dev',
    icon: extV0Icon,
    isPurchased: true,
    price: 6700,
    originalPrice: 14700,
  },
  manus: {
    id: 'manus' as const,
    name: 'Manus AI',
    description: 'Extensão para Manus.app',
    icon: extManusIcon,
    isPurchased: true,
    price: 6700,
    originalPrice: 14700,
  },
};

// Other products (non-extensions)
const otherProducts = [
  {
    id: 'metodo-google-ai',
    name: 'Método Google AI Ultra',
    description: '45.000 Créditos (INFINITO) - VEO 3.1, Gemini 2.5 Pro e mais!',
    icon: googleAiIcon,
    isPurchased: true, // Set to true to show content
    price: 4700,
    originalPrice: 19700,
    badge: 'NOVO',
    badgeColor: 'amber' as const,
  },
  {
    id: 'metodo-conta-pro',
    name: 'Método Conta PRO Lovable',
    description: 'Crie contas PRO no Lovable sem custos mensais recorrentes.',
    icon: lovableColorIcon,
    isPurchased: false, // TODO: check from session/database
    price: 3900,
    originalPrice: 7990,
    badge: 'NOVO',
    badgeColor: 'amber' as const,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 22
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25
    }
  },
  exit: { 
    opacity: 0, 
    y: -30, 
    scale: 0.95,
    transition: {
      duration: 0.25
    }
  }
};

const selectorVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  }
};

const LovAcesso = () => {
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem('lov_access_email') || 'Não disponível';
  const userName = sessionStorage.getItem('lov_user_name') || 'Não disponível';
  const userDocument = sessionStorage.getItem('lov_user_document') || 'Não disponível';
  const userFingerprint = sessionStorage.getItem('lov_user_fingerprint') || 'Não ativado';
  const licenseKey = sessionStorage.getItem('lov_license_key') || null;
  const subscriptionsRaw = sessionStorage.getItem('lov_subscriptions');
  const subscriptions = subscriptionsRaw ? JSON.parse(subscriptionsRaw) : [];
  const purchasedProductsRaw = sessionStorage.getItem('lov_purchased_products');
  const purchasedProducts = purchasedProductsRaw ? JSON.parse(purchasedProductsRaw) : [];
  
  const [selectedExtension, setSelectedExtension] = useState<ExtensionType>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [selectedView, setSelectedView] = useState<'extensions' | 'outros' | null>(null);
  const [showMetodoGoogleAI, setShowMetodoGoogleAI] = useState(false);
  const currentExtension = selectedExtension ? extensions[selectedExtension] : null;
  const isLocked = currentExtension && !currentExtension.isPurchased;

  // Product type mapping
  const productTitleToType: Record<string, string> = {
    "Extensão Lovable": "lovable",
    "Licença Extensão Lovable": "lovable",
    "Extensão V0.dev": "v0",
    "Licença Extensão V0.dev": "v0",
    "Extensão Manus AI": "manus",
    "Licença Extensão Manus AI": "manus",
    "Zyra PRO": "zyra_pro",
  };

  // Calculate access info for the header
  const accessInfo = useMemo(() => {
    // Check if has any active subscription
    const activeSubscription = subscriptions.find((s: any) => s.status === 'active' && !s.is_expired);
    
    // User is LIFETIME if:
    // 1. Has purchased products but NO subscriptions at all (old purchases before subscription system)
    // 2. Has a license key (indicates they purchased an extension)
    const hasLicenseKey = !!licenseKey;
    const hasPurchasedProducts = purchasedProducts.length > 0;
    const hasNoSubscriptions = subscriptions.length === 0;
    
    // Lifetime = has license OR has products with no subscriptions
    const isLifetime = hasLicenseKey && hasNoSubscriptions;
    
    // Calculate days left for subscription
    let daysLeft = 0;
    let planLabel = 'Mensal';
    if (activeSubscription) {
      const periodEnd = new Date(activeSubscription.current_period_end);
      daysLeft = differenceInDays(periodEnd, new Date());
      planLabel = activeSubscription.plan_type === 'yearly' ? 'Anual' : 'Mensal';
    }

    // Get available extensions for the user
    const availableExtensions: string[] = [];
    if (isLifetime || activeSubscription || hasPurchasedProducts) {
      // Zyra PRO gives access to all 3
      availableExtensions.push('Lovable', 'V0.dev', 'Manus AI');
    }

    return {
      isLifetime,
      hasSubscription: !!activeSubscription,
      daysLeft,
      planLabel,
      availableExtensions,
      totalCycleDays: activeSubscription?.plan_type === 'yearly' ? 365 : 30,
    };
  }, [subscriptions, purchasedProducts, licenseKey]);

  const handleLogout = () => {
    sessionStorage.removeItem('lov_access_email');
    sessionStorage.removeItem('lov_license_key');
    sessionStorage.removeItem('lov_user_name');
    sessionStorage.removeItem('lov_user_document');
    sessionStorage.removeItem('lov_user_fingerprint');
    sessionStorage.removeItem('lov_user_phone');
    window.location.reload();
  };

  const handleCopy = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleCopyKey = () => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleBuyExtension = () => {
    if (currentExtension) {
      navigate(`/checkout?product=${currentExtension.id}&price=${currentExtension.price}&originalPrice=${currentExtension.originalPrice}`);
    }
  };

  const handleBuyProduct = (productId: string, price: number) => {
    navigate(`/checkout?product=${productId}&price=${price}`);
  };

  const ticketItems = [
    { id: 'name', label: 'Nome', value: userName, icon: User },
    { id: 'email', label: 'Email', value: userEmail, icon: Mail },
    { id: 'document', label: 'CPF', value: userDocument, icon: FileText },
    { id: 'fingerprint', label: 'Fingerprint', value: userFingerprint, icon: Fingerprint },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <CinematicBackground />
      <FreeSidebar />

      {/* Ambient Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 py-3 border-b border-white/5 backdrop-blur-xl bg-background/20"
      >
        <div className="container flex items-center justify-between">
          <img src={zyraLogoMembers} alt="Zyra Pro" className="h-7 w-auto" />
          
          <div className="flex items-center gap-2">
            {/* License Ticket Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <Key className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Minha Licença</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                sideOffset={8}
                className="w-[calc(100vw-2rem)] sm:w-80 max-w-80 p-0 bg-[#1a1625]/98 backdrop-blur-xl border-white/10 mx-4 sm:mx-0"
              >
                {/* Ticket Design */}
                <div className="relative overflow-hidden">
                  {/* Ticket Header */}
                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 px-4 py-3 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                          <Key className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Licença</p>
                          <p className="text-xs font-medium text-foreground">Zyra Pro</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 text-[10px] font-medium">Ativa</span>
                      </div>
                    </div>
                  </div>

                  {/* Subscription/Access Info Section */}
                  <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {accessInfo.isLifetime ? (
                          <>
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo de Acesso</p>
                              <div className="flex items-center gap-1.5">
                                <Infinity className="w-3.5 h-3.5 text-amber-400" />
                                <p className="text-xs font-semibold text-amber-400">Vitalício</p>
                              </div>
                            </div>
                          </>
                        ) : accessInfo.hasSubscription ? (
                          <>
                            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plano {accessInfo.planLabel}</p>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <p className="text-xs font-medium text-foreground">
                                  {accessInfo.daysLeft > 0 ? `${accessInfo.daysLeft} dias restantes` : 'Expirado'}
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-7 h-7 rounded-lg bg-muted/20 border border-muted/30 flex items-center justify-center">
                              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                              <p className="text-xs font-medium text-muted-foreground">Sem assinatura ativa</p>
                            </div>
                          </>
                        )}
                      </div>
                      {accessInfo.hasSubscription && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Ciclo</p>
                          <p className="text-xs font-medium text-foreground">{accessInfo.totalCycleDays} dias</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Available Extensions */}
                  {accessInfo.availableExtensions.length > 0 && (
                    <div className="px-4 py-3 bg-white/[0.01] border-b border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Extensões Disponíveis</p>
                      <div className="flex flex-wrap gap-1.5">
                        {accessInfo.availableExtensions.map((ext) => (
                          <div 
                            key={ext}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20"
                          >
                            <Puzzle className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-medium text-primary">{ext}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ticket Perforated Line */}
                  <div className="relative h-4 overflow-hidden">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-background rounded-r-full" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-background rounded-l-full" />
                    <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-white/10" />
                  </div>

                  {/* License Key */}
                  <div className="px-4 py-3 bg-white/[0.02]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Chave de Licença</p>
                        <code className="text-sm font-mono text-foreground tracking-wide">{licenseKey || 'Não disponível'}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyKey}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary shrink-0"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Ticket Perforated Line */}
                  <div className="relative h-4 overflow-hidden">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-background rounded-r-full" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-background rounded-l-full" />
                    <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-white/10" />
                  </div>

                  {/* User Info Items */}
                  <div className="px-4 py-3 space-y-2">
                    {ticketItems.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <item.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-muted-foreground">{item.label}</p>
                            <p className="text-xs text-foreground break-all">{item.value}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(item.value, item.id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        >
                          {copiedItem === item.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Ticket Footer */}
                  <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5">
                    <p className="text-[10px] text-center text-muted-foreground">
                      Válida para uso pessoal e intransferível
                    </p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-muted-foreground hover:text-foreground hover:bg-white/5 gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Sair</span>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 py-8 sm:py-12">
        <div className="container max-w-3xl">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Logo & Welcome - Compact */}
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <img 
                src={zyraLogoMembers} 
                alt="Zyra Pro" 
                className="h-12 sm:h-14 w-auto mx-auto"
              />
              <p className="text-muted-foreground text-xs sm:text-sm">
                Área exclusiva de membros
              </p>
            </motion.div>

            {/* Product Selector Dropdown */}
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">Selecionar seu produto:</p>
              <Select 
                value={selectedExtension || selectedView || ''} 
                onValueChange={(v) => {
                  if (v === 'outros') {
                    setSelectedExtension(null);
                    setSelectedView('outros');
                  } else {
                    setSelectedView(null);
                    setSelectedExtension(v as ExtensionType);
                  }
                }}
              >
                <SelectTrigger className="w-80 h-16 bg-white/[0.03] border-primary/20 hover:border-primary/40 transition-colors rounded-xl">
                  <SelectValue placeholder="Escolha um produto...">
                    {currentExtension ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5">
                          <img src={currentExtension.icon} alt={currentExtension.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">{currentExtension.name}</p>
                          <p className="text-[10px] text-muted-foreground">{currentExtension.description}</p>
                        </div>
                      </div>
                    ) : selectedView === 'outros' ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 border border-amber-500/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">Outros Produtos</p>
                          <p className="text-[10px] text-muted-foreground">Métodos e cursos adicionais</p>
                        </div>
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1625]/98 backdrop-blur-xl border-white/10">
                  {/* Extensions Section */}
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium px-2">Extensões</p>
                  </div>
                  {Object.values(extensions).map((ext) => (
                    <SelectItem 
                      key={ext.id} 
                      value={ext.id}
                      className="cursor-pointer hover:bg-white/5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5">
                          <img src={ext.icon} alt={ext.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ext.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ext.description}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* Separator */}
                  <div className="my-2 h-px bg-white/10" />
                  
                  {/* Other Products Section */}
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium px-2">Outros Produtos</p>
                  </div>
                  <SelectItem 
                    value="outros"
                    className="cursor-pointer hover:bg-white/5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 border border-amber-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Outros Produtos</p>
                        <p className="text-[10px] text-muted-foreground">Métodos e cursos adicionais</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </motion.div>


            {/* Método Google AI Ultra Content */}
            <AnimatePresence mode="wait">
              {showMetodoGoogleAI && (
                <motion.div
                  key="metodo-google-ai-content"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <MetodoContaPro 
                    onBack={() => {
                      setShowMetodoGoogleAI(false);
                      setSelectedView('outros');
                    }} 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Other Products Content */}
            <AnimatePresence mode="wait">
              {selectedView === 'outros' && !showMetodoGoogleAI && (
                <motion.div
                  key="outros-produtos"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Products Grid */}
                  <div className="grid gap-4">
                    {otherProducts.map((product) => (
                      <div 
                        key={product.id}
                        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1625] via-[#1e1833] to-[#1a1625]"
                      >
                        {/* Badge */}
                        {product.badge && (
                          <div className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full z-10 ${
                            product.badgeColor === 'amber' 
                              ? 'bg-amber-500 text-amber-950' 
                              : 'bg-primary text-white'
                          }`}>
                            {product.badge}
                          </div>
                        )}
                        
                        {/* Top Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                        
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                            {/* Product Icon + Badge Mobile */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center p-2 sm:p-3 flex-shrink-0">
                                <img src={product.icon} alt={product.name} className="w-full h-full object-contain" />
                              </div>
                              
                              {/* Title on mobile - next to icon */}
                              <div className="flex-1 sm:hidden min-w-0">
                                <h3 className="text-sm font-semibold text-white leading-tight">{product.name}</h3>
                                <p className="text-[11px] text-white/60 leading-relaxed mt-1 line-clamp-2">{product.description}</p>
                              </div>
                            </div>
                            
                            {/* Product Info - Desktop */}
                            <div className="hidden sm:block flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-white mb-1">{product.name}</h3>
                              <p className="text-xs text-white/60 leading-relaxed mb-4">{product.description}</p>
                              
                              {product.isPurchased ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400 text-xs font-medium">Comprado</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-primary hover:text-primary/80 text-xs"
                                    onClick={() => {
                                      if (product.id === 'metodo-google-ai') {
                                        setSelectedView(null);
                                        setShowMetodoGoogleAI(true);
                                      }
                                    }}
                                  >
                                    Acessar Conteúdo
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xs text-white/40 line-through">
                                      R$ {(product.originalPrice / 100).toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-lg font-bold text-primary">
                                      R$ {(product.price / 100).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleBuyProduct(product.id, product.price)}
                                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-xs px-4"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                    Comprar
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* Mobile Actions */}
                            <div className="w-full sm:hidden pt-2 border-t border-white/5">
                              {product.isPurchased ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 text-[11px] font-medium">Comprado</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-primary hover:text-primary/80 text-xs h-8"
                                    onClick={() => {
                                      if (product.id === 'metodo-google-ai') {
                                        setSelectedView(null);
                                        setShowMetodoGoogleAI(true);
                                      }
                                    }}
                                  >
                                    Acessar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-[11px] text-white/40 line-through">
                                      R$ {(product.originalPrice / 100).toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-base font-bold text-primary">
                                      R$ {(product.price / 100).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleBuyProduct(product.id, product.price)}
                                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-xs px-3 h-8"
                                  >
                                    <ShoppingCart className="w-3 h-3 mr-1" />
                                    Comprar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Empty State if no products */}
                  {otherProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm">Nenhum produto adicional disponível</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Extension Content - Only shows when extension is selected */}
            <AnimatePresence mode="wait">
              {selectedExtension && currentExtension && (
                <motion.div
                  key={selectedExtension}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Locked State for V0 and Manus - Compact Horizontal Layout */}
                  {isLocked ? (
                    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1a1625] via-[#1e1833] to-[#1a1625]">
                      {/* Top Glow Effect */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                      <div className="absolute top-0 left-1/4 w-1/3 h-32 bg-primary/8 blur-3xl pointer-events-none" />
                      
                      {/* Main Content - Two Column Layout for Desktop */}
                      <div className="flex flex-col sm:flex-row">
                        {/* Left Side - Product Info */}
                        <div className="flex-1 p-6 sm:p-8 flex flex-col items-center sm:items-start justify-center border-b sm:border-b-0 sm:border-r border-white/5">
                          {/* Beta Badge */}
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-amber-400 text-[10px] font-medium tracking-wide uppercase">Acesso Beta</span>
                          </div>
                          
                          {/* Extension Icon - Larger */}
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center p-4 mb-4 shadow-xl shadow-black/20">
                            <img src={currentExtension.icon} alt={currentExtension.name} className="w-full h-full object-contain" />
                          </div>
                          
                          <h3 className="text-xl font-semibold text-foreground mb-1 text-center sm:text-left">
                            Extensão {currentExtension.name}
                          </h3>
                          <p className="text-sm text-muted-foreground text-center sm:text-left">
                            Créditos ilimitados na plataforma
                          </p>
                          
                          {/* Lock indicator */}
                          <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Conteúdo bloqueado</span>
                          </div>
                        </div>
                        
                        {/* Right Side - Pricing & CTA */}
                        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
                          {/* Pricing */}
                          <div className="text-center sm:text-left mb-5">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                              <span className="text-sm text-muted-foreground/60 line-through">
                                R$ {(currentExtension.originalPrice / 100).toFixed(2).replace('.', ',')}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                                50% OFF
                              </span>
                            </div>
                            <div className="flex items-baseline justify-center sm:justify-start gap-1">
                              <span className="text-sm text-muted-foreground">R$</span>
                              <span className="text-4xl font-bold text-foreground tracking-tight">{Math.floor(currentExtension.price / 100)}</span>
                              <span className="text-base text-muted-foreground">,{String(currentExtension.price % 100).padStart(2, '0')}</span>
                            </div>
                          </div>
                          
                          {/* Quick Features */}
                          <div className="grid grid-cols-2 gap-2 mb-5">
                            {[
                              { icon: Key, text: 'Licença vitalícia' },
                              { icon: Monitor, text: 'Créditos ilimitados' },
                              { icon: Users, text: 'Comunidade VIP' },
                              { icon: Puzzle, text: 'Extensão exclusiva' },
                            ].map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-foreground/70">
                                <feature.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>{feature.text}</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Buy Button */}
                          <Button
                            size="lg"
                            onClick={handleBuyExtension}
                            className="w-full gap-2 py-5 text-sm font-semibold bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/35 hover:scale-[1.01]"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Comprar Acesso</span>
                          </Button>
                          
                          {/* Footer Info */}
                          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Pagamento único</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Acesso imediato</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom Glow */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                  ) : (
                    <>

                      {/* Video Card - Only for purchased extensions */}
                      {selectedExtension === 'lovable' ? (
                        <>
                          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 backdrop-blur-sm">
                            {/* Video Header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-1.5">
                                <img src={currentExtension?.icon} alt={currentExtension?.name} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-foreground">Tutorial {currentExtension?.name}</h3>
                                <p className="text-[11px] text-muted-foreground">Como usar a extensão</p>
                              </div>
                            </div>
                            
                            {/* Video Player - Responsive */}
                            <div className="relative w-full">
                              <WistiaVideo 
                                aspectRatio="16:9" 
                                mediaId="jiac42ir00"
                                overlayTitle="Toque para assistir..."
                                overlaySubtitle="Tutorial completo da extensão"
                              />
                            </div>
                          </div>

                          {/* Download Button */}
                          <Button
                            size="lg"
                            className="w-full gap-3 py-6 text-sm bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
                            onClick={() => setIsDownloadModalOpen(true)}
                          >
                            <Download className="w-5 h-5" />
                            <span>Baixar Extensão {currentExtension?.name}</span>
                          </Button>
                        </>
                      ) : (
                        /* V0 and Manus - Updating State */
                        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-primary/10 backdrop-blur-sm">
                          {/* Header */}
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-500/20">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 p-1.5">
                              <img src={currentExtension?.icon} alt={currentExtension?.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-foreground">Extensão {currentExtension?.name}</h3>
                              <p className="text-[11px] text-amber-400">Em atualização</p>
                            </div>
                          </div>
                          
                          {/* Update Content */}
                          <div className="p-6 sm:p-8 text-center">
                            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-5">
                              <Shield className="w-10 h-10 text-amber-400 animate-pulse" />
                            </div>
                            
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              Conteúdo em Atualização
                            </h3>
                            
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                              Estamos atualizando o vídeo e download, aguarde alguns minutos...
                            </p>
                            
                            {/* Download Button - Disabled */}
                            <Button
                              size="lg"
                              className="w-full gap-3 py-6 text-sm bg-gradient-to-r from-amber-500/50 to-primary/50 opacity-60 cursor-not-allowed"
                              disabled
                              onClick={() => setIsDownloadModalOpen(true)}
                            >
                              <Download className="w-5 h-5" />
                              <span>Baixar Extensão {currentExtension?.name}</span>
                            </Button>
                            
                            <p className="text-[11px] text-muted-foreground mt-4">
                              A extensão estará disponível em breve. Obrigado pela paciência!
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Tutorial Accordion - Only for purchased extensions */}
                  {!isLocked && (
                  <Accordion type="single" collapsible className="space-y-2">
                    <AccordionItem 
                      value="tutorial" 
                      className="border border-primary/20 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 backdrop-blur-sm overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/[0.02] [&[data-state=open]]:border-b [&[data-state=open]]:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/30">
                            <Key className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-sm font-medium text-foreground">Tutorial de Ativação</h3>
                            <p className="text-[11px] text-muted-foreground">Passo a passo para ativar sua licença</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-4 pb-4">
                        <div className="space-y-4">
                          {/* Step 1 */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium">
                              1
                            </div>
                            <div className="flex-1 space-y-2">
                              <p className="text-xs text-muted-foreground">
                                Abra a extensão e insira sua chave de licença
                              </p>
                              <div className="rounded-lg overflow-hidden border border-white/10">
                                <img 
                                  src={activationStep1} 
                                  alt="Passo 1" 
                                  className="w-full h-auto max-h-48 object-contain bg-black/20"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium">
                              2
                            </div>
                            <div className="flex-1 space-y-2">
                              <p className="text-xs text-muted-foreground">
                                Após ativar, atualize a página do {currentExtension?.name} e comece a usar
                              </p>
                              <div className="rounded-lg overflow-hidden border border-white/10">
                                <img 
                                  src={activationStep2} 
                                  alt="Passo 2" 
                                  className="w-full h-auto max-h-48 object-contain bg-black/20"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem 
                      value="install" 
                      className="border border-primary/20 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 backdrop-blur-sm overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/[0.02] [&[data-state=open]]:border-b [&[data-state=open]]:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/30">
                            <Puzzle className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-sm font-medium text-foreground">Como Instalar</h3>
                            <p className="text-[11px] text-muted-foreground">Instalação no Chrome/Edge</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-4 pb-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[10px] font-medium text-muted-foreground">1</span>
                            <p className="text-xs text-muted-foreground">Baixe o arquivo .zip da extensão</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[10px] font-medium text-muted-foreground">2</span>
                            <p className="text-xs text-muted-foreground">Extraia o conteúdo para uma pasta</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[10px] font-medium text-muted-foreground">3</span>
                            <p className="text-xs text-muted-foreground">
                              Acesse <code className="px-1 py-0.5 rounded bg-white/10 text-[10px]">chrome://extensions</code>
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[10px] font-medium text-muted-foreground">4</span>
                            <p className="text-xs text-muted-foreground">Ative o "Modo de desenvolvedor"</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[10px] font-medium text-muted-foreground">5</span>
                            <p className="text-xs text-muted-foreground">Clique em "Carregar sem compactação" e selecione a pasta</p>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                            <Monitor className="w-3.5 h-3.5" />
                            <span>Compatível com Chrome, Edge, Brave e Opera</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    {/* Important Rules Accordion */}
                    <AccordionItem 
                      value="rules" 
                      className="border border-amber-500/30 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 backdrop-blur-sm overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/[0.02] [&[data-state=open]]:border-b [&[data-state=open]]:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-sm font-medium text-amber-200">IMPORTANTE! Leia atentamente.</h3>
                            <p className="text-[11px] text-amber-400/70">Regras de uso e licenciamento</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-4 pb-4">
                        <div className="space-y-4 text-xs text-muted-foreground">

                          {/* Rule 1 - Code Modification */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30">
                              <Shield className="w-3 h-3 text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">1. Proibição de Modificação de Código</p>
                              <p className="leading-relaxed">É expressamente proibido alterar, remover ou injetar código, descompilar, ofuscar novamente, reempacotar ou redistribuir a extensão. Tentar burlar validações, limites ou mecanismos de segurança também é vedado. <span className="text-red-400 font-medium">Qualquer modificação invalida automaticamente a licença, sem aviso prévio.</span></p>
                            </div>
                          </div>

                          {/* Rule 2 - Integrity */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30">
                              <Eye className="w-3 h-3 text-amber-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">2. Verificação de Integridade</p>
                              <p className="leading-relaxed">A extensão possui sistema que detecta alterações nos arquivos, estrutura ou comportamento esperado e valida a assinatura interna do código em tempo de execução. Caso seja identificada qualquer divergência, a licença é considerada violada.</p>
                            </div>
                          </div>

                          {/* Rule 3 - Ban */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30">
                              <Ban className="w-3 h-3 text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">3. Banimento Automático</p>
                              <p className="leading-relaxed">Em caso de violação: a licença será permanentemente banida, o IP associado poderá ser bloqueado e o acesso aos serviços será revogado <span className="text-red-400 font-medium">sem possibilidade de reativação</span>. Tentativas repetidas podem resultar em bloqueios adicionais.</p>
                            </div>
                          </div>

                          {/* Rule 4 - Piracy */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30">
                              <Share2 className="w-3 h-3 text-orange-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">4. Uso Indevido e Pirataria</p>
                              <p className="leading-relaxed">Qualquer tentativa de compartilhar licenças, utilizar em ambientes não autorizados ou distribuir versões modificadas será tratada como uso indevido e enquadrada como pirataria do software.</p>
                            </div>
                          </div>

                          {/* Rule 5 - Purpose */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                              <ServerCrash className="w-3 h-3 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">5. Finalidade do Sistema</p>
                              <p className="leading-relaxed">O sistema de proteção existe para garantir a estabilidade da extensão, proteger usuários legítimos e evitar abusos. Não é coletado conteúdo pessoal além do necessário para validação de licença e segurança.</p>
                            </div>
                          </div>

                          {/* Rule 6 - Single Device */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 border border-primary/30">
                              <Laptop className="w-3 h-3 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">6. Vinculação de Licença a Dispositivo</p>
                              <p className="leading-relaxed">Cada licença é estritamente vinculada a um único ambiente/dispositivo no momento da ativação. Não é permitido ativar em múltiplos dispositivos, compartilhar entre usuários ou transferir sem autorização formal. A licença é associada a identificadores técnicos, tornando a ativação exclusiva e não reutilizável.</p>
                            </div>
                          </div>

                          {/* Rule 7 - Multi Device */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30">
                              <Monitor className="w-3 h-3 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">7. Licenciamento Multi-Dispositivo</p>
                              <p className="leading-relaxed">Caso necessário utilizar em mais de um dispositivo, é obrigatória a aquisição de licenças adicionais. Não há compartilhamento, pooling de licenças ou uso simultâneo sob uma única chave.</p>
                            </div>
                          </div>

                          {/* Rule 8 - Consequences */}
                          <div className="flex gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30">
                              <Gavel className="w-3 h-3 text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">8. Consequências de Violação</p>
                              <p className="leading-relaxed">Em caso de violação, o licenciante poderá adotar uma ou mais medidas sem aviso: revogar permanentemente a licença, bloquear acesso a serviços e atualizações, invalidar chaves relacionadas, restringir IPs e ambientes associados.</p>
                            </div>
                          </div>

                          {/* Warning Footer */}
                          <div className="mt-4 pt-3 border-t border-red-500/20 bg-red-500/5 -mx-4 px-4 py-3 rounded-b-lg">
                            <div className="flex items-start gap-2">
                              <UserX className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-red-300 leading-relaxed">
                                <span className="font-semibold">As medidas aplicadas são definitivas e irreversíveis</span>, não cabendo reativação, reembolso ou compensação de qualquer natureza.
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Community Cards - Always visible */}
            <motion.div variants={itemVariants} className="pt-4">
              <p className="text-xs text-muted-foreground text-center mb-4">Comunidade & Suporte</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WhatsApp Card */}
                <motion.a
                  href="https://shre.ink/5b7b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border-2 border-[#25D366]/30 bg-gradient-to-br from-[#25D366]/15 via-[#128C7E]/10 to-[#075E54]/15 backdrop-blur-sm p-5 hover:border-[#25D366]/50 hover:shadow-[0_0_30px_rgba(37,211,102,0.15)] transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative flex items-center gap-4">
                    {/* WhatsApp Icon */}
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#25D366]/20 border-2 border-[#25D366]/40 shadow-lg shadow-[#25D366]/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-foreground mb-1">Grupo WhatsApp</h3>
                      <p className="text-xs text-muted-foreground">Networking exclusivo com toda galera</p>
                    </div>
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#25D366]/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Users className="w-4 h-4 text-[#25D366]" />
                    </div>
                  </div>
                </motion.a>

                {/* Discord Card */}
                <motion.div
                  className="group relative overflow-hidden rounded-2xl border-2 border-[#5865F2]/30 bg-gradient-to-br from-[#5865F2]/15 via-[#7289DA]/10 to-[#5865F2]/15 backdrop-blur-sm p-5 opacity-70 cursor-not-allowed"
                >
                  {/* Coming Soon Banner */}
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-gradient-to-r from-[#5865F2] to-[#7289DA] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl shadow-lg">
                      Em breve!
                    </div>
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] z-[5]" />
                  
                  <div className="relative flex items-center gap-4">
                    {/* Discord Icon */}
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5865F2]/20 border-2 border-[#5865F2]/40 shadow-lg shadow-[#5865F2]/10">
                      <svg className="w-7 h-7 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-foreground mb-1">Servidor Discord</h3>
                      <p className="text-xs text-muted-foreground">Suporte rápido e comunidade ativa</p>
                    </div>
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#5865F2]/20">
                      <MessageCircle className="w-4 h-4 text-[#5865F2]" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Products Carousel - Below Community Cards, only when extension is selected */}
            {selectedExtension && (
              <motion.div variants={itemVariants} className="pt-2">
                <ProductsCarousel />
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>

      {/* Download Extension Modal */}
      <DownloadExtensionModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        extensionName={currentExtension?.name || ''}
        extensionId={currentExtension?.id || ''}
        licenseKey={licenseKey}
      />
    </div>
  );
};

export default LovAcesso;

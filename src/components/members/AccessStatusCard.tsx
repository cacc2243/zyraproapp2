import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ChevronDown,
  ChevronUp,
  CreditCard,
  Sparkles,
  Infinity,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Icons for products
import extLovableIcon from "@/assets/ext-lovable-icon.png";
import extV0Icon from "@/assets/ext-v0-icon.png";
import extManusIcon from "@/assets/ext-manus-icon.png";

interface Subscription {
  id: string;
  product_type: string;
  plan_type: string;
  status: string;
  amount: number;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  cancelled_at: string | null;
  is_expired: boolean;
}

interface AccessStatusCardProps {
  subscriptions: Subscription[];
  purchasedProducts: string[];
  licenseKey: string | null;
}

const productConfig: Record<string, { name: string; icon: string; checkoutId: string }> = {
  lovable: { name: "Extensão Lovable", icon: extLovableIcon, checkoutId: "lovable" },
  v0: { name: "Extensão V0.dev", icon: extV0Icon, checkoutId: "v0" },
  manus: { name: "Extensão Manus AI", icon: extManusIcon, checkoutId: "manus" },
};

// Map product titles to product types
const productTitleToType: Record<string, string> = {
  "Extensão Lovable": "lovable",
  "Licença Extensão Lovable": "lovable",
  "Extensão V0.dev": "v0",
  "Licença Extensão V0.dev": "v0",
  "Extensão Manus AI": "manus",
  "Licença Extensão Manus AI": "manus",
};

const planLabels: Record<string, string> = {
  monthly: "Mensal",
  yearly: "Anual",
  lifetime: "Vitalício",
  // Legacy support
  weekly: "Semanal",
};

// Prices for renewal (in cents) - Unified plan with all 3 AIs
const renewalPrices: Record<string, number> = {
  monthly: 9700,
  yearly: 29700,
};

const formatPrice = (cents: number) => {
  return (cents / 100).toFixed(2).replace(".", ",");
};

const AccessStatusCard = ({ subscriptions, purchasedProducts, licenseKey }: AccessStatusCardProps) => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build a combined list of access items
  // 1. Active subscriptions
  // 2. Lifetime access (products purchased but no active subscription)
  
  const subscriptionProductTypes = subscriptions.map(s => s.product_type);
  
  // Get lifetime products (purchased but not in subscriptions)
  const lifetimeProducts = purchasedProducts
    .map(title => {
      const type = productTitleToType[title];
      return type;
    })
    .filter(type => type && !subscriptionProductTypes.includes(type))
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  const hasAnyAccess = subscriptions.length > 0 || lifetimeProducts.length > 0;

  if (!hasAnyAccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 shadow-lg shadow-primary/10">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-foreground">Meu Acesso</h2>
            <p className="text-[11px] text-muted-foreground">Gerencie seus produtos</p>
          </div>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">
            Você ainda não possui nenhum produto ativo.
          </p>
          <Button
            onClick={() => navigate("/checkout?product=lovable&plan=monthly")}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Adquirir Extensão
          </Button>
        </div>
      </motion.div>
    );
  }

  const handleRenew = (planType: string) => {
    const price = renewalPrices[planType] || 9700;
    navigate(`/checkout?plan=${planType}&price=${price}`);
  };

  const handleUpgrade = (currentPlan: string) => {
    navigate(`/checkout?upgrade=true&current_plan=${currentPlan}`);
  };

  const getStatusConfig = (sub: Subscription) => {
    const periodEnd = new Date(sub.current_period_end);
    const daysLeft = differenceInDays(periodEnd, new Date());
    
    if (sub.status === 'expired' || sub.is_expired) {
      return {
        label: "Expirado",
        color: "bg-red-500/15 border-red-500/30 text-red-400",
        icon: AlertTriangle,
        urgent: true,
      };
    }
    if (sub.status === 'cancelled') {
      return {
        label: "Cancelado",
        color: "bg-orange-500/15 border-orange-500/30 text-orange-400",
        icon: AlertTriangle,
        urgent: true,
      };
    }
    if (sub.status === 'suspended') {
      return {
        label: "Suspenso",
        color: "bg-red-500/15 border-red-500/30 text-red-400",
        icon: AlertTriangle,
        urgent: true,
      };
    }
    if (daysLeft <= 3 && daysLeft >= 0) {
      return {
        label: `Expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`,
        color: "bg-amber-500/15 border-amber-500/30 text-amber-400",
        icon: Clock,
        urgent: true,
      };
    }
    return {
      label: "Ativo",
      color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      icon: CheckCircle,
      urgent: false,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 shadow-lg shadow-primary/10">
          <CreditCard className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-foreground">Meu Acesso</h2>
          <p className="text-[11px] text-muted-foreground">Gerencie seus produtos e assinaturas</p>
        </div>
      </div>

      {/* Access Cards */}
      <div className="space-y-3">
        {/* Lifetime Access Cards */}
        {lifetimeProducts.map((productType) => {
          const product = productConfig[productType];
          if (!product) return null;
          
          return (
            <motion.div
              key={`lifetime-${productType}`}
              className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-sm"
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {/* Product Icon */}
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0">
                    <img src={product.icon} alt={product.name} className="w-full h-full object-contain" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 border-amber-500/20 text-amber-400">
                        <Crown className="w-2.5 h-2.5 mr-1" />
                        Vitalício
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
                        <Infinity className="w-3 h-3" />
                        <span className="text-[10px] font-medium">Acesso Permanente</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Subscription Cards */}
        {subscriptions.map((sub) => {
          const product = productConfig[sub.product_type] || { name: sub.product_type, icon: extLovableIcon, checkoutId: sub.product_type };
          const status = getStatusConfig(sub);
          const StatusIcon = status.icon;
          const isExpanded = expandedId === sub.id;
          const periodEnd = new Date(sub.current_period_end);
          const isExpiredOrSuspended = sub.status === 'expired' || sub.status === 'suspended' || sub.is_expired;

          return (
            <motion.div
              key={sub.id}
              className={`relative overflow-hidden rounded-2xl border ${
                status.urgent 
                  ? 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent' 
                  : 'border-white/10 bg-white/[0.02]'
              } backdrop-blur-sm`}
              layout
            >
              {/* Main Row */}
              <div 
                className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : sub.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Product Icon */}
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0">
                    <img src={product.icon} alt={product.name} className="w-full h-full object-contain" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 border-primary/20 text-primary">
                        {planLabels[sub.plan_type] || sub.plan_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{status.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Toggle */}
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5"
                >
                  <div className="p-4 space-y-4">
                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Início do Ciclo</p>
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(sub.current_period_start), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fim do Ciclo</p>
                        <p className={`text-sm font-medium ${isPast(periodEnd) ? 'text-red-400' : 'text-foreground'}`}>
                          {format(periodEnd, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Valor</p>
                        <p className="text-sm font-medium text-foreground">
                          R$ {formatPrice(sub.amount)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          {isPast(periodEnd) ? 'Expirou' : 'Expira em'}
                        </p>
                        <p className={`text-sm font-medium ${isPast(periodEnd) ? 'text-red-400' : 'text-foreground'}`}>
                          {formatDistanceToNow(periodEnd, { locale: ptBR, addSuffix: !isPast(periodEnd) })}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {isExpiredOrSuspended ? (
                        <Button
                          onClick={() => handleRenew(sub.plan_type)}
                          className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Renovar Agora - R$ {formatPrice(renewalPrices[sub.plan_type] || 9700)}
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleRenew(sub.plan_type)}
                            variant="outline"
                            className="flex-1 gap-2 border-primary/30 hover:bg-primary/10"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Renovar Antecipado
                          </Button>
                          {sub.plan_type !== 'yearly' && (
                            <Button
                              onClick={() => handleUpgrade(sub.plan_type)}
                              variant="ghost"
                              className="gap-2 text-primary hover:bg-primary/10"
                            >
                              <Sparkles className="w-4 h-4" />
                              Upgrade
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Warning for expired */}
                    {isExpiredOrSuspended && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-red-300">
                          <p className="font-medium mb-0.5">Sua assinatura expirou</p>
                          <p className="text-red-400/80">Renove agora para continuar usando a extensão sem interrupções.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AccessStatusCard;

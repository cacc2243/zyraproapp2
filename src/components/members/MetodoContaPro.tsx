import { useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ChevronDown,
  ChevronUp,
  Shield,
  CreditCard,
  Globe,
  UserPlus,
  Wifi,
  Chrome,
  FileText,
  Landmark,
  Settings,
  Wallet,
  Gift,
  Sparkles,
  XCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MetodoContaProProps {
  onBack: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
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

const steps = [
  {
    number: 1,
    title: "Configuração da VPN",
    icon: Wifi,
    description: "Conecte-se a um servidor VPN localizado na Índia. Para confirmar que está conectado corretamente, verifique seu IP.",
    button: {
      text: "Verificar meu IP",
      url: "https://whatismyip.com"
    }
  },
  {
    number: 2,
    title: "Configuração do Navegador",
    icon: Chrome,
    description: "Abra um novo perfil no Google Chrome. Isso garante que não haja métodos de pagamento ou contas salvas. Faça login com a conta Google que você preparou.",
    button: null
  },
  {
    number: 3,
    title: "Inscrição Inicial",
    icon: UserPlus,
    description: 'Acesse a página do Google AI Ultra para a Índia clicando no botão abaixo. Em seguida, clique em "Buy Now" e "Continue".',
    button: {
      text: "Acessar Google AI Ultra (Índia)",
      url: "https://workspace.google.com/intl/en_in/products/ai-ultra/"
    }
  },
  {
    number: 4,
    title: "Endereço Indiano Falso",
    icon: FileText,
    description: "O Google solicitará um endereço de faturamento na Índia. Use um gerador de endereços para preencher os campos.",
    button: {
      text: "Gerar Endereço Indiano",
      url: "https://www.fakexy.com/fake-address-generator-in"
    }
  },
  {
    number: 5,
    title: 'O Truque do "Netbanking"',
    icon: Landmark,
    description: 'Na tela de pagamento, você verá a opção "Pay with Netbanking". Não adicione um método de pagamento ainda. Apenas clique em "Agree and continue". Esta é a etapa crucial que trava o preço indiano.',
    button: null,
    highlight: true
  },
  {
    number: 6,
    title: "Acessar o Console de Administração",
    icon: Settings,
    description: 'Após continuar, você será redirecionado. Acesse o Google Workspace e, no canto superior direito, clique em "Admin Console".',
    button: {
      text: "Acessar Google Workspace",
      url: "https://workspace.google.com/"
    }
  },
  {
    number: 7,
    title: "Configuração do Faturamento",
    icon: Wallet,
    description: 'Dentro do Admin Console, navegue até Billing > Subscriptions. Clique na assinatura do Google AI Ultra for Business e procure o banner vermelho com a opção "Make a prepayment".',
    button: null
  },
  {
    number: 8,
    title: "Pagamento (Mudança para Cartão)",
    icon: CreditCard,
    description: 'Clique em "Pay now". Altere o método de "Netbanking" para "Payment with card". Insira os dados do seu cartão e pague as 500 INR (~US$ 6).',
    button: null
  },
  {
    number: 9,
    title: "Adicionar Créditos de Bônus",
    icon: Gift,
    description: 'Volte para Billing > Subscriptions, clique na assinatura e role para baixo até "Edit setting". Adicione 20.000 créditos de IA como bônus.',
    button: null
  },
  {
    number: 10,
    title: "Verificação Final",
    icon: Sparkles,
    description: "Acesse o Gemini e verifique seu saldo de créditos. Ele deve exibir um total de aproximadamente 45.000 créditos.",
    button: {
      text: "Acessar Gemini",
      url: "https://gemini.google.com/"
    }
  }
];

const prerequisites = [
  {
    icon: Globe,
    title: "VPN com Servidor na Índia",
    description: "Opções como ProtonVPN, Windscribe ou TunnelBear funcionam bem."
  },
  {
    icon: CreditCard,
    title: "Cartão de Crédito/Débito",
    description: "Necessário para o pagamento de 500 INR (aproximadamente US$ 6)."
  },
  {
    icon: UserPlus,
    title: "Conta Google",
    description: "Preferencialmente uma conta nova ou que não contenha dados importantes."
  },
  {
    icon: Shield,
    title: "Cartão Descartável (Recomendado)",
    description: "Serviços como Bybit VCC ou outros cartões virtuais são ideais para evitar cobranças recorrentes indesejadas."
  }
];

const risks = [
  {
    icon: AlertCircle,
    title: "Assinatura Recorrente",
    description: "Lembre-se de que esta é uma assinatura. O Google tentará renová-la automaticamente. Cancele a assinatura após obter os créditos ou use um cartão virtual com saldo limitado."
  },
  {
    icon: XCircle,
    title: "Cancelamento",
    description: "Para cancelar, vá em Admin Console > Billing > Subscriptions > Cancel."
  },
  {
    icon: AlertTriangle,
    title: "Violação dos Termos de Serviço",
    description: "Este método viola os Termos de Serviço do Google. Use por sua conta e risco."
  }
];

const MetodoContaPro = ({ onBack }: MetodoContaProProps) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Back Button */}
      <motion.div variants={itemVariants}>
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos produtos
        </Button>
      </motion.div>

      {/* Main Title */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">Método Exclusivo</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
          Guia Completo: Como Obter{" "}
          <span className="text-gradient">45.000 Créditos</span>{" "}
          no Gemini Advanced por Apenas{" "}
          <span className="text-emerald-400">$6</span>
        </h1>
      </motion.div>

      {/* Introduction */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
            Este guia detalha um método para adquirir uma quantidade substancial de créditos no{" "}
            <span className="font-semibold text-foreground">Gemini Advanced</span>, o modelo de IA mais poderoso do Google, por uma fração do preço padrão. Utilizando uma brecha nos preços regionais da Índia, é possível obter{" "}
            <span className="font-semibold text-primary">45.000 créditos</span> por aproximadamente{" "}
            <span className="font-semibold text-emerald-400">US$ 6</span>, em vez dos US$ 30 mensais por 10.000 créditos cobrados nos EUA.
          </p>
        </div>

        {/* Warning Alert */}
        <Alert className="bg-amber-500/10 border-amber-500/30">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <AlertTitle className="text-amber-300 font-semibold">Aviso Importante</AlertTitle>
          <AlertDescription className="text-amber-200/80 text-sm mt-2">
            Este método explora uma brecha nos Termos de Serviço do Google e, embora não seja ilegal, apresenta riscos. A empresa pode detectar o uso de VPN, cancelar a assinatura ou até mesmo suspender a conta. 
            <span className="font-medium text-amber-200"> Recomenda-se o uso de uma conta Google secundária e um cartão de crédito virtual ou descartável para minimizar quaisquer riscos.</span>
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Prerequisites */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          O Que Você Precisa Antes de Começar
        </h2>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {prerequisites.map((item, index) => (
            <div 
              key={index}
              className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Step by Step Guide */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          O Método: Passo a Passo Detalhado
        </h2>

        <div className="space-y-3">
          {steps.map((step) => (
            <div 
              key={step.number}
              className={`
                bg-card/40 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300
                ${step.highlight ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/50'}
                ${expandedStep === step.number ? 'ring-1 ring-primary/30' : ''}
              `}
            >
              <button
                onClick={() => setExpandedStep(expandedStep === step.number ? null : step.number)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                {/* Step Number */}
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm
                  ${step.highlight 
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' 
                    : 'bg-primary/20 border border-primary/30 text-primary'
                  }
                `}>
                  {step.number}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm sm:text-base ${step.highlight ? 'text-amber-300' : 'text-foreground'}`}>
                    {step.title}
                  </p>
                </div>

                {/* Icon */}
                <step.icon className={`w-5 h-5 flex-shrink-0 ${step.highlight ? 'text-amber-400' : 'text-muted-foreground'}`} />

                {/* Expand/Collapse */}
                {expandedStep === step.number ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Expanded Content */}
              {expandedStep === step.number && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4 pt-0"
                >
                  <div className="pl-14 space-y-4">
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {step.description}
                    </p>
                    
                    {step.button && (
                      <Button
                        asChild
                        className="gap-2 bg-primary hover:bg-primary/90"
                      >
                        <a href={step.button.url} target="_blank" rel="noopener noreferrer">
                          {step.button.text}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}

                    {step.highlight && (
                      <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200/80">
                          Esta é a etapa mais importante! Não pule este passo.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Risks and Recommendations */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/20 border border-destructive/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          Riscos e Recomendações
        </h2>

        <div className="space-y-3">
          {risks.map((risk, index) => (
            <div 
              key={index}
              className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-destructive/15 border border-destructive/25 flex items-center justify-center flex-shrink-0">
                <risk.icon className="w-5 h-5 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground text-sm">{risk.title}</p>
                <p className="text-xs text-muted-foreground">{risk.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Conclusion */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          Conclusão
        </h2>

        <div className="bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-2xl p-6">
          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
            Este método oferece uma oportunidade única de acessar o poder do{" "}
            <span className="font-semibold text-foreground">Gemini Advanced</span> por um custo muito baixo. Seguindo os passos com atenção e tomando as devidas precauções, você poderá explorar todo o potencial da IA do Google sem comprometer seu orçamento.
          </p>
          
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              Economia de mais de <span className="text-emerald-400 font-medium">80%</span> em relação ao preço padrão
            </p>
          </div>
        </div>
      </motion.div>

      {/* Back Button Bottom */}
      <motion.div variants={itemVariants} className="pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a área de membros
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default MetodoContaPro;

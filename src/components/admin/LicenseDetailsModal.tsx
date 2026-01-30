import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Key, Calendar, Zap, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LicenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: {
    license_key: string;
    license_created_at: string | null;
    license_origin: 'automatic' | 'manual' | null;
    access_granted: boolean;
    customer_name: string;
    customer_email: string;
    customer_document: string | null;
  } | null;
}

const LicenseDetailsModal = ({ isOpen, onClose, license }: LicenseDetailsModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!license) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Licença copiada!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return null;
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9)}`;
  };

  const getOriginLabel = (origin: 'automatic' | 'manual' | null) => {
    if (origin === 'automatic') return 'Automática (Pagamento)';
    if (origin === 'manual') return 'Manual (Painel Admin)';
    return 'Não definida';
  };

  const getOriginBadgeVariant = (origin: 'automatic' | 'manual' | null) => {
    if (origin === 'automatic') return 'default';
    if (origin === 'manual') return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Detalhes da Licença
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre a licença do cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{license.customer_name}</p>
                <p className="text-xs text-muted-foreground break-all">{license.customer_email}</p>
              </div>
            </div>
            {license.customer_document && (
              <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">CPF</p>
                  <p className="text-sm font-mono break-all">{formatCPF(license.customer_document)}</p>
                </div>
              </div>
            )}
          </div>

          {/* License Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Licença</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                {license.license_key}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(license.license_key)}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <div>
              <Badge variant={license.access_granted ? 'default' : 'destructive'}>
                {license.access_granted ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </div>

          {/* Creation Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data de Criação
            </label>
            <p className="text-sm">
              {formatDate(license.license_created_at)}
            </p>
          </div>

          {/* Origin */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Origem
            </label>
            <div>
              <Badge variant={getOriginBadgeVariant(license.license_origin)}>
                {getOriginLabel(license.license_origin)}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseDetailsModal;

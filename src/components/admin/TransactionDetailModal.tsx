import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Copy, 
  MessageCircle,
  Key,
  Loader2,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction, statusColors, statusLabels } from './TransactionsTab';
import { cn } from '@/lib/utils';

const SUPABASE_URL = "https://gjzhntrcogbamirtudsp.supabase.co";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onRefresh?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

const TransactionDetailModal = ({ transaction, onClose, onRefresh }: TransactionDetailModalProps) => {
  const { toast } = useToast();
  const [savingLicense, setSavingLicense] = useState(false);
  const [licenseInput, setLicenseInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone?.replace(/\D/g, '') || '';
    const message = encodeURIComponent(`Olá ${name}, tudo bem?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBytes = new Uint8Array(12); // 3 segments x 4 chars
    window.crypto.getRandomValues(randomBytes);
    
    const parts: string[] = ['ZYRA'];
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars[randomBytes[i * 4 + j] % chars.length];
      }
      parts.push(segment);
    }
    
    return parts.join('-');
  };

  const getToken = () => localStorage.getItem('admin_token');

  const handleGenerateAndSaveLicense = async () => {
    setSavingLicense(true);
    try {
      const newLicense = generateLicenseKey();
      const token = getToken();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/save-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transaction_id: transaction.id,
          license_key: newLicense
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        if (result.error === 'Esta licença já está em uso') {
          toast({ title: 'Licença já existe, gerando outra...', variant: 'destructive' });
          setSavingLicense(false);
          return handleGenerateAndSaveLicense();
        }
        throw new Error(result.error);
      }

      toast({ title: 'Licença gerada e salva!' });
      onRefresh?.();
    } catch (error) {
      console.error('Error saving license:', error);
      toast({ title: 'Erro ao salvar licença', variant: 'destructive' });
    } finally {
      setSavingLicense(false);
    }
  };

  const handleSaveManualLicense = async () => {
    if (!licenseInput.trim()) {
      toast({ title: 'Digite uma licença', variant: 'destructive' });
      return;
    }

    setSavingLicense(true);
    try {
      const upperLicense = licenseInput.trim().toUpperCase();
      const token = getToken();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/save-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transaction_id: transaction.id,
          license_key: upperLicense
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        toast({ title: result.error || 'Erro ao salvar', variant: 'destructive' });
        setSavingLicense(false);
        return;
      }

      toast({ title: 'Licença salva!' });
      setLicenseInput('');
      onRefresh?.();
    } catch (error) {
      console.error('Error saving license:', error);
      toast({ title: 'Erro ao salvar licença', variant: 'destructive' });
    } finally {
      setSavingLicense(false);
    }
  };

  const copyLicense = () => {
    if (transaction.license_key) {
      navigator.clipboard.writeText(transaction.license_key);
      setCopied(true);
      toast({ title: 'Licença copiada!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={!!transaction} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="transaction-detail-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Detalhes da Transação
            <Badge className={cn(
              statusColors[transaction.payment_status]?.bg,
              statusColors[transaction.payment_status]?.text
            )}>
              {statusLabels[transaction.payment_status] || transaction.payment_status}
            </Badge>
          </DialogTitle>
          <DialogDescription id="transaction-detail-description">
            Informações completas da transação e gerenciamento de licença.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cliente */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">CLIENTE</h3>
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{transaction.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{transaction.customer_email}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(transaction.customer_email, 'E-mail')}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {transaction.customer_phone && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Telefone:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{transaction.customer_phone}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(transaction.customer_phone, 'Telefone')}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 text-emerald-500"
                      onClick={() => openWhatsApp(transaction.customer_phone, transaction.customer_name)}
                    >
                      <MessageCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              {transaction.customer_document && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF:</span>
                  <span className="font-medium">{transaction.customer_document}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pagamento */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">PAGAMENTO</h3>
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-bold text-primary text-lg">{formatCurrency(transaction.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método:</span>
                <span className="font-medium uppercase">{transaction.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acesso:</span>
                <Badge variant={transaction.access_granted ? "default" : "secondary"}>
                  {transaction.access_granted ? "Liberado" : "Bloqueado"}
                </Badge>
              </div>
              {transaction.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pago em:</span>
                  <span className="font-medium">{formatDate(transaction.paid_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Licença */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">LICENÇA</h3>
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              {transaction.license_key ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <code className="font-mono text-sm bg-background px-2 py-1 rounded">
                      {transaction.license_key}
                    </code>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8" 
                    onClick={copyLicense}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Nenhuma licença vinculada</p>
                  
                  <Button 
                    onClick={handleGenerateAndSaveLicense} 
                    disabled={savingLicense}
                    className="w-full"
                  >
                    {savingLicense ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Gerar Licença Automaticamente
                  </Button>

                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite uma licença manual..."
                      value={licenseInput}
                      onChange={(e) => setLicenseInput(e.target.value.toUpperCase())}
                      className="font-mono flex-1"
                    />
                    <Button 
                      onClick={handleSaveManualLicense} 
                      disabled={savingLicense || !licenseInput.trim()}
                      variant="outline"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Tracking */}
          {(transaction.utm_source || transaction.utm_medium || transaction.utm_campaign || transaction.utm_content || transaction.utm_term || transaction.src || transaction.fbp || transaction.fbc) && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">RASTREAMENTO</h3>
              <div className="space-y-2 bg-muted/30 p-4 rounded-lg text-sm">
                {transaction.utm_source && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UTM Source:</span>
                    <span className="font-medium">{transaction.utm_source}</span>
                  </div>
                )}
                {transaction.utm_medium && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UTM Medium:</span>
                    <span className="font-medium">{transaction.utm_medium}</span>
                  </div>
                )}
                {transaction.utm_campaign && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UTM Campaign:</span>
                    <span className="font-medium">{transaction.utm_campaign}</span>
                  </div>
                )}
                {transaction.utm_content && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UTM Content:</span>
                    <span className="font-medium">{transaction.utm_content}</span>
                  </div>
                )}
                {transaction.utm_term && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UTM Term:</span>
                    <span className="font-medium">{transaction.utm_term}</span>
                  </div>
                )}
                {transaction.src && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SRC:</span>
                    <span className="font-medium">{transaction.src}</span>
                  </div>
                )}
                {transaction.fbp && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FBP:</span>
                    <span className="font-medium text-xs break-all">{transaction.fbp}</span>
                  </div>
                )}
                {transaction.fbc && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FBC:</span>
                    <span className="font-medium text-xs break-all">{transaction.fbc}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Datas */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">DATAS</h3>
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span className="font-medium">{formatDate(transaction.created_at)}</span>
              </div>
              {transaction.updated_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atualizado em:</span>
                  <span className="font-medium">{formatDate(transaction.updated_at)}</span>
                </div>
              )}
              {transaction.access_granted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acesso liberado em:</span>
                  <span className="font-medium">{formatDate(transaction.access_granted_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailModal;

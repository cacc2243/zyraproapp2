import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Loader2,
  Search,
  Calendar,
  CreditCard,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  Play,
  Pause,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Subscription {
  id: string;
  customer_email: string;
  customer_name: string;
  customer_document: string | null;
  customer_phone: string | null;
  product_type: string;
  plan_type: string;
  amount: number;
  status: string;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  cancelled_at: string | null;
  license_id: string | null;
  created_at: string;
  licenses?: {
    license_key: string;
    status: string;
  } | null;
}

interface Summary {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  suspended: number;
  mrr: number;
  arr: number;
}

interface SubscriptionPayment {
  id: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  paid_at: string | null;
  created_at: string;
}

const getToken = () => sessionStorage.getItem('admin_token');

const SubscriptionsTab = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubscriptions = async (page = 1) => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (productFilter !== 'all') params.set('product_type', productFilter);
      if (emailFilter.trim()) params.set('email', emailFilter.trim());

      const response = await fetch(
        `https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-subscriptions?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();

      if (data.success) {
        setSubscriptions(data.data || []);
        setSummary(data.summary);
        setTotalPages(data.pagination?.totalPages || 1);
        setCurrentPage(page);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar assinaturas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (subscriptionId: string) => {
    setLoadingPayments(true);
    try {
      const token = getToken();
      const response = await fetch(
        `https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-subscriptions?subscription_id=${subscriptionId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setPayments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleAction = async (subscriptionId: string, action: string, extraData?: object) => {
    setActionLoading(subscriptionId);
    try {
      const token = getToken();
      const response = await fetch(
        'https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-subscriptions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, subscription_id: subscriptionId, ...extraData }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({ title: data.message || 'Ação executada com sucesso!' });
        fetchSubscriptions(currentPage);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: 'Erro ao executar ação', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, productFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSubscriptions(1);
  };

  const openDetails = (sub: Subscription) => {
    setSelectedSubscription(sub);
    fetchPaymentHistory(sub.id);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      active: { variant: 'default', icon: <CheckCircle2 className="w-3 h-3" /> },
      expired: { variant: 'destructive', icon: <AlertCircle className="w-3 h-3" /> },
      cancelled: { variant: 'secondary', icon: <XCircle className="w-3 h-3" /> },
      suspended: { variant: 'outline', icon: <Pause className="w-3 h-3" /> },
    };
    const config = variants[status] || variants.expired;
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      weekly: 'Semanal',
      monthly: 'Mensal',
      yearly: 'Anual',
    };
    return labels[plan] || plan;
  };

  const getProductLabel = (product: string) => {
    const labels: Record<string, string> = {
      lovable: 'Lovable',
      v0: 'V0.dev',
      manus: 'Manus AI',
    };
    return labels[product] || product;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `R$ ${(amount / 100).toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativas</p>
              <p className="text-2xl font-bold text-foreground">{summary?.active || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiradas</p>
              <p className="text-2xl font-bold text-foreground">{summary?.expired || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MRR</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.mrr || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ARR</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.arr || 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar por email..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-background"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="lovable">Lovable</SelectItem>
                <SelectItem value="v0">V0.dev</SelectItem>
                <SelectItem value="manus">Manus AI</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => fetchSubscriptions(currentPage)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-muted-foreground">Produto</TableHead>
                <TableHead className="text-muted-foreground">Plano</TableHead>
                <TableHead className="text-muted-foreground">Valor</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Próx. Renovação</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma assinatura encontrada
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-border">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{sub.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{sub.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getProductLabel(sub.product_type)}</Badge>
                    </TableCell>
                    <TableCell>{getPlanLabel(sub.plan_type)}</TableCell>
                    <TableCell>{formatCurrency(sub.amount)}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(sub.next_billing_date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionLoading === sub.id}>
                            {actionLoading === sub.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetails(sub)}>
                            <Search className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          {sub.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleAction(sub.id, 'cancel')}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                          {(sub.status === 'expired' || sub.status === 'cancelled') && (
                            <DropdownMenuItem onClick={() => handleAction(sub.id, 'reactivate')}>
                              <Play className="w-4 h-4 mr-2" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleAction(sub.id, 'extend', { days: 30 })}>
                            <Plus className="w-4 h-4 mr-2" />
                            Estender 30 dias
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSubscriptions(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSubscriptions(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              {/* Subscription Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedSubscription.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSubscription.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produto/Plano</p>
                  <p className="font-medium">
                    {getProductLabel(selectedSubscription.product_type)} - {getPlanLabel(selectedSubscription.plan_type)}
                  </p>
                  <p className="text-sm">{formatCurrency(selectedSubscription.amount)}/período</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedSubscription.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Licença</p>
                  <p className="font-mono text-sm">{selectedSubscription.licenses?.license_key || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Início</p>
                  <p>{formatDate(selectedSubscription.started_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próx. Renovação</p>
                  <p>{formatDate(selectedSubscription.next_billing_date)}</p>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-semibold mb-3">Histórico de Pagamentos</h4>
                {loadingPayments ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.paid_at || payment.created_at)}</TableCell>
                          <TableCell>
                            {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsTab;
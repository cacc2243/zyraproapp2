import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  TrendingUp,
  Eye,
  Loader2,
  Unlock,
  Lock,
  CalendarIcon,
  MessageCircle,
  Phone,
  Mail,
  User,
  Wrench,
  Key,
  ChevronLeft,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import TransactionDetailModal from './TransactionDetailModal';
import LicenseDetailsModal from './LicenseDetailsModal';

export interface Transaction {
  id: string;
  transaction_hash: string;
  pepper_transaction_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  pix_code: string;
  pix_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  src: string;
  ip_address: string;
  fbp: string;
  fbc: string;
  offer_title: string;
  product_title: string;
  created_at: string;
  updated_at: string;
  paid_at: string;
  access_granted: boolean;
  access_granted_at: string | null;
  license_key: string | null;
  license_created_at: string | null;
  license_origin: 'automatic' | 'manual' | null;
}

export interface Summary {
  total: number;
  paid: number;
  waiting_payment: number;
  refused: number;
  total_revenue: number;
}

export const statusColors: Record<string, { bg: string; text: string }> = {
  paid: { bg: 'bg-emerald-500/20', text: 'text-emerald-500' },
  waiting_payment: { bg: 'bg-amber-500/20', text: 'text-amber-500' },
  processing: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
  authorized: { bg: 'bg-cyan-500/20', text: 'text-cyan-500' },
  refused: { bg: 'bg-red-500/20', text: 'text-red-500' },
  refunded: { bg: 'bg-purple-500/20', text: 'text-purple-500' },
  chargeback: { bg: 'bg-red-600/20', text: 'text-red-600' },
  cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-500' },
  checkout_abandoned: { bg: 'bg-gray-500/20', text: 'text-gray-500' },
};

export const statusLabels: Record<string, string> = {
  paid: 'Pago',
  waiting_payment: 'Aguardando',
  processing: 'Processando',
  authorized: 'Autorizado',
  refused: 'Recusado',
  refunded: 'Reembolsado',
  chargeback: 'Chargeback',
  cancelled: 'Cancelado',
  checkout_abandoned: 'Abandonado',
};

export type DateFilterType = 'today' | 'yesterday' | '7days' | '14days' | '30days' | 'custom';

export const getDateRange = (filterType: DateFilterType, customFrom?: Date, customTo?: Date) => {
  const now = new Date();
  let from: Date;
  let to: Date = endOfDay(now);

  switch (filterType) {
    case 'today':
      from = startOfDay(now);
      break;
    case 'yesterday':
      from = startOfDay(subDays(now, 1));
      to = endOfDay(subDays(now, 1));
      break;
    case '7days':
      from = startOfDay(subDays(now, 6));
      break;
    case '14days':
      from = startOfDay(subDays(now, 13));
      break;
    case '30days':
      from = startOfDay(subDays(now, 29));
      break;
    case 'custom':
      from = customFrom ? startOfDay(customFrom) : startOfDay(now);
      to = customTo ? endOfDay(customTo) : endOfDay(now);
      break;
    default:
      from = startOfDay(now);
  }

  return { from, to };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

interface TransactionsTabProps {
  transactions: Transaction[];
  summary: Summary | null;
  loading: boolean;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateFilter: DateFilterType;
  setDateFilter: (value: DateFilterType) => void;
  customDateFrom: Date | undefined;
  setCustomDateFrom: (value: Date | undefined) => void;
  customDateTo: Date | undefined;
  setCustomDateTo: (value: Date | undefined) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  togglingAccess: boolean;
  handleToggleAccess: (grantAccess: boolean) => void;
  generatingBulkLicenses: boolean;
  handleBulkGenerateLicenses: () => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  emailFilter: string;
  setEmailFilter: (value: string) => void;
  onEmailSearch: () => void;
}

const ITEMS_PER_PAGE = 50;

const TransactionsTab = ({
  transactions,
  summary,
  loading,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  selectedIds,
  setSelectedIds,
  togglingAccess,
  handleToggleAccess,
  generatingBulkLicenses,
  handleBulkGenerateLicenses,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onRefresh,
  emailFilter,
  setEmailFilter,
  onEmailSearch
}: TransactionsTabProps) => {
  const isMobile = useIsMobile();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [licenseDetailsTransaction, setLicenseDetailsTransaction] = useState<Transaction | null>(null);

  const toggleSelection = (id: string) => {
    setSelectedIds(
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(t => t.id));
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone?.replace(/\D/g, '') || '';
    const message = encodeURIComponent(`Olá ${name}, tudo bem?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <Card className="p-3 lg:p-4 bg-card border-border">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Total</p>
                <p className="text-lg lg:text-xl font-bold text-foreground">{summary.total}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 lg:p-4 bg-card border-border">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Pagos</p>
                <p className="text-lg lg:text-xl font-bold text-emerald-500">{summary.paid}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 lg:p-4 bg-card border-border">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Aguardando</p>
                <p className="text-lg lg:text-xl font-bold text-amber-500">{summary.waiting_payment}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 lg:p-4 bg-card border-border">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="w-4 h-4 lg:w-5 lg:h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Recusados</p>
                <p className="text-lg lg:text-xl font-bold text-red-500">{summary.refused}</p>
              </div>
            </div>
          </Card>
          
          <Card className="col-span-2 lg:col-span-1 p-3 lg:p-4 bg-card border-border">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Receita</p>
                <p className="text-lg lg:text-xl font-bold text-primary">{formatCurrency(summary.total_revenue)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Email Search */}
        <div className="flex gap-2 flex-1 sm:max-w-xs">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar por email, nome ou telefone..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onEmailSearch()}
              className="bg-card border-border pr-8"
            />
            {emailFilter && (
              <button
                onClick={() => {
                  setEmailFilter('');
                  onEmailSearch();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={onEmailSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="waiting_payment">Aguardando</SelectItem>
            <SelectItem value="refused">Recusados</SelectItem>
            <SelectItem value="refunded">Reembolsados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilterType)}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="14days">Últimos 14 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {dateFilter === 'custom' && (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-[130px]",
                    !customDateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateFrom ? format(customDateFrom, "dd/MM/yy") : "De"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateFrom}
                  onSelect={setCustomDateFrom}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-[130px]",
                    !customDateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateTo ? format(customDateTo, "dd/MM/yy") : "Até"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateTo}
                  onSelect={setCustomDateTo}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="flex gap-2 ml-auto flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkGenerateLicenses}
              disabled={generatingBulkLicenses}
              className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
            >
              {generatingBulkLicenses ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Key className="w-4 h-4 mr-1" />}
              Gerar Licenças ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggleAccess(true)}
              disabled={togglingAccess}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
            >
              {togglingAccess ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
              Liberar ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggleAccess(false)}
              disabled={togglingAccess}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30"
            >
              {togglingAccess ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
              Bloquear ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isMobile ? (
        /* Mobile Cards */
        <div className="space-y-3">
          {transactions.map(tx => (
            <Card key={tx.id} className="p-4 bg-card border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.includes(tx.id)}
                    onCheckedChange={() => toggleSelection(tx.id)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{tx.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{tx.customer_email}</span>
                    </div>
                    {tx.customer_phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{tx.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={cn(
                  'text-xs',
                  statusColors[tx.payment_status]?.bg,
                  statusColors[tx.payment_status]?.text
                )}>
                  {statusLabels[tx.payment_status] || tx.payment_status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary">{formatCurrency(tx.amount)}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</span>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant={tx.access_granted ? "default" : "secondary"} className="text-xs">
                  {tx.access_granted ? "Acesso Liberado" : "Sem Acesso"}
                </Badge>
                {tx.license_key && (
                  <div className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-muted-foreground" />
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{tx.license_key}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => setLicenseDetailsTransaction(tx)}
                    >
                      <Wrench className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedTransaction(tx)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Detalhes
                </Button>
                {tx.customer_phone && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openWhatsApp(tx.customer_phone, tx.customer_name)}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop Table */
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedIds.length === transactions.length && transactions.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-muted-foreground">Licença</TableHead>
                <TableHead className="text-muted-foreground">Valor</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Acesso</TableHead>
                <TableHead className="text-muted-foreground">Data</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id} className="hover:bg-muted/10">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(tx.id)}
                      onCheckedChange={() => toggleSelection(tx.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{tx.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{tx.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tx.license_key ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{tx.license_key}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setLicenseDetailsTransaction(tx)}
                        >
                          <Wrench className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-primary">{formatCurrency(tx.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      'text-xs',
                      statusColors[tx.payment_status]?.bg,
                      statusColors[tx.payment_status]?.text
                    )}>
                      {statusLabels[tx.payment_status] || tx.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.access_granted ? "default" : "secondary"} className="text-xs">
                      {tx.access_granted ? "Liberado" : "Bloqueado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {tx.customer_phone && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openWhatsApp(tx.customer_phone, tx.customer_name)}
                          className="text-emerald-500 hover:text-emerald-400"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onRefresh={onRefresh}
      />

      {/* License Details Modal */}
      <LicenseDetailsModal
        isOpen={!!licenseDetailsTransaction}
        onClose={() => setLicenseDetailsTransaction(null)}
        license={licenseDetailsTransaction ? {
          license_key: licenseDetailsTransaction.license_key!,
          license_created_at: licenseDetailsTransaction.license_created_at,
          license_origin: licenseDetailsTransaction.license_origin,
          access_granted: licenseDetailsTransaction.access_granted,
          customer_name: licenseDetailsTransaction.customer_name,
          customer_email: licenseDetailsTransaction.customer_email,
          customer_document: licenseDetailsTransaction.customer_document,
        } : null}
      />
    </div>
  );
};

export default TransactionsTab;

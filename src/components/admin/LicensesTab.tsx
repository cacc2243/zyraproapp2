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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Search, 
  RefreshCw, 
  MoreVertical, 
  Play, 
  Pause, 
  XCircle, 
  RotateCcw,
  Smartphone,
  Copy,
  Check,
  Loader2,
  Key,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DeviceDetailsModal from './DeviceDetailsModal';

interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  language?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  timezone?: string;
  screen?: string;
  colorDepth?: number;
  pixelRatio?: number;
}

interface LicenseDevice {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  is_active: boolean;
  first_seen_at: string;
  last_seen_at: string;
  ip_address: string | null;
  device_info?: DeviceInfo;
}

interface License {
  id: string;
  license_key: string;
  status: 'active' | 'suspended' | 'revoked' | 'awaiting_activation';
  origin: 'automatic' | 'manual';
  max_devices: number;
  activated_at: string | null;
  created_at: string;
  transaction_id: string | null;
  license_devices: LicenseDevice[];
  transaction: {
    customer_name: string;
    customer_email: string;
  } | null;
}

interface Summary {
  total: number;
  active: number;
  suspended: number;
  revoked: number;
  awaiting_activation: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  revoked: 'bg-red-500/20 text-red-400 border-red-500/30',
  awaiting_activation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const statusLabels: Record<string, string> = {
  active: 'Ativa',
  suspended: 'Suspensa',
  revoked: 'Revogada',
  awaiting_activation: 'Aguardando Ativação',
};

const ITEMS_PER_PAGE = 50;

const LicensesTab = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    license: License | null;
    action: string;
  }>({ open: false, license: null, action: '' });
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
    open: boolean;
    action: 'reset_all_devices' | 'suspend_all' | null;
  }>({ open: false, action: null });
  const [deviceModal, setDeviceModal] = useState<{
    open: boolean;
    device: LicenseDevice | null;
    licenseKey: string;
  }>({ open: false, device: null, licenseKey: '' });
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const getToken = () => sessionStorage.getItem('admin_token');

  const fetchLicenses = async (page = currentPage) => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', page.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(
        `https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-licenses?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setLicenses(data.data || []);
        setSummary(data.summary);
        setTotalItems(data.pagination?.total || data.data?.length || 0);
        setTotalPages(data.pagination?.totalPages || Math.ceil((data.data?.length || 0) / ITEMS_PER_PAGE));
        setCurrentPage(page);
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar licenças', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchLicenses(1);
  }, [statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLicenses(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLicenses(newPage);
    }
  };

  const handleAction = async (license: License, action: string) => {
    if (action === 'revoke' || action === 'reset_device' || action === 'reset_password') {
      setConfirmDialog({ open: true, license, action });
      return;
    }
    
    await executeAction(license.id, action);
  };

  const executeAction = async (licenseId: string, action: string) => {
    setActionLoading(licenseId);
    try {
      const token = getToken();
      const response = await fetch(
        'https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-licenses',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ license_id: licenseId, action })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({ title: data.message });
        fetchLicenses();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: 'Erro ao executar ação', variant: 'destructive' });
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, license: null, action: '' });
    }
  };

  const executeBulkAction = async (action: 'reset_all_devices' | 'suspend_all') => {
    setBulkActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        'https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-licenses',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({ title: data.message });
        fetchLicenses();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: 'Erro ao executar ação em massa', variant: 'destructive' });
    } finally {
      setBulkActionLoading(false);
      setBulkConfirmDialog({ open: false, action: null });
    }
  };

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: 'Licença copiada!' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yy HH:mm", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{summary.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-500">{summary.active}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-500">{summary.suspended}</p>
                <p className="text-xs text-muted-foreground">Suspensas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <ShieldX className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{summary.revoked}</p>
                <p className="text-xs text-muted-foreground">Revogadas</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por licença, email, nome ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="suspended">Suspensas</SelectItem>
                  <SelectItem value="revoked">Revogadas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => fetchLicenses(currentPage)} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Bulk Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Ações em massa:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkConfirmDialog({ open: true, action: 'reset_all_devices' })}
              disabled={bulkActionLoading}
              className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Resetar Todos Dispositivos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkConfirmDialog({ open: true, action: 'suspend_all' })}
              disabled={bulkActionLoading}
              className="text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
            >
              <Pause className="w-4 h-4 mr-1" />
              Suspender Todas
            </Button>
          </div>
        </div>
      </Card>

      {/* Licenses List */}
      <Card className="bg-card border-border overflow-hidden">
        {isMobile ? (
          // Mobile Layout
          <div className="divide-y divide-border">
            {licenses.map((license) => (
              <div key={license.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLicenseKey(license.license_key)}
                      className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {license.license_key}
                      {copiedKey === license.license_key ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <Badge className={statusColors[license.status]}>
                    {statusLabels[license.status]}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>{license.transaction?.customer_name || 'Manual'}</p>
                  <p className="text-xs">{license.transaction?.customer_email || '-'}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    <span className={license.license_devices?.length >= license.max_devices ? 'text-red-400 font-medium' : ''}>
                      {license.license_devices?.length || 0}/{license.max_devices}
                    </span>
                  </div>
                  <span>{formatDate(license.created_at)}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ativada:</span>
                  {license.activated_at ? (
                    <span className="text-green-400">{formatDate(license.activated_at)}</span>
                  ) : (
                    <span className="text-muted-foreground">Não ativada</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {license.status !== 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-green-500 border-green-500/30"
                      onClick={() => handleAction(license, 'activate')}
                      disabled={actionLoading === license.id}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Ativar
                    </Button>
                  )}
                  {license.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-yellow-500 border-yellow-500/30"
                      onClick={() => handleAction(license, 'suspend')}
                      disabled={actionLoading === license.id}
                    >
                      <Pause className="w-3 h-3 mr-1" />
                      Suspender
                    </Button>
                  )}
                  {license.license_devices?.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleAction(license, 'reset_device')}
                      disabled={actionLoading === license.id}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop Layout
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Licença</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dispositivos</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ativada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => (
                <TableRow key={license.id} className="border-border">
                  <TableCell>
                    <button
                      onClick={() => copyLicenseKey(license.license_key)}
                      className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {license.license_key}
                      {copiedKey === license.license_key ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <Badge variant="outline" className="text-xs mt-1">
                      {license.origin === 'automatic' ? 'Auto' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{license.transaction?.customer_name || '-'}</p>
                      <p className="text-xs text-muted-foreground">
                        {license.transaction?.customer_email || 'Sem vínculo'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[license.status]}>
                      {statusLabels[license.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <span className={license.license_devices?.length >= license.max_devices ? 'text-red-400 font-medium' : ''}>
                        {license.license_devices?.length || 0}/{license.max_devices}
                      </span>
                    </div>
                    {license.license_devices?.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => setDeviceModal({ open: true, device, licenseKey: license.license_key })}
                        className="text-xs text-primary hover:underline truncate max-w-[150px] flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        {device.device_name || device.device_fingerprint.substring(0, 8) + '...'}
                      </button>
                    ))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(license.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {license.activated_at ? (
                      <span className="text-green-400">{formatDate(license.activated_at)}</span>
                    ) : (
                      <span className="text-muted-foreground">Não ativada</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={actionLoading === license.id}>
                          {actionLoading === license.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {license.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handleAction(license, 'activate')}>
                            <Play className="w-4 h-4 mr-2 text-green-500" />
                            Ativar
                          </DropdownMenuItem>
                        )}
                        {license.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleAction(license, 'suspend')}>
                            <Pause className="w-4 h-4 mr-2 text-yellow-500" />
                            Suspender
                          </DropdownMenuItem>
                        )}
                        {license.status !== 'revoked' && (
                          <DropdownMenuItem onClick={() => handleAction(license, 'revoke')}>
                            <XCircle className="w-4 h-4 mr-2 text-red-500" />
                            Revogar
                          </DropdownMenuItem>
                        )}
                        {license.license_devices?.length > 0 && (
                          <DropdownMenuItem onClick={() => handleAction(license, 'reset_device')}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Resetar Dispositivo
                          </DropdownMenuItem>
                        )}
                        {license.transaction?.customer_email && (
                          <DropdownMenuItem onClick={() => handleAction(license, 'reset_password')}>
                            <KeyRound className="w-4 h-4 mr-2 text-orange-500" />
                            Redefinir Senha
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {licenses.length === 0 && !loading && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma licença encontrada
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, license: null, action: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'revoke' 
                ? 'Revogar Licença' 
                : confirmDialog.action === 'reset_password'
                ? 'Redefinir Senha'
                : 'Resetar Dispositivo'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'revoke' 
                ? 'Tem certeza que deseja revogar esta licença? Esta ação é permanente e a licença não poderá mais ser usada.'
                : confirmDialog.action === 'reset_password'
                ? 'Tem certeza que deseja redefinir a senha deste usuário? Ele precisará cadastrar uma nova senha para acessar a área de membros.'
                : 'Tem certeza que deseja resetar o dispositivo? O usuário poderá ativar a licença em um novo dispositivo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-mono text-center text-lg">{confirmDialog.license?.license_key}</p>
            {confirmDialog.action === 'reset_password' && confirmDialog.license?.transaction?.customer_email && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                {confirmDialog.license.transaction.customer_email}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, license: null, action: '' })}>
              Cancelar
            </Button>
            <Button 
              variant={confirmDialog.action === 'revoke' ? 'destructive' : 'default'}
              onClick={() => confirmDialog.license && executeAction(confirmDialog.license.id, confirmDialog.action)}
              disabled={actionLoading !== null}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirm Dialog */}
      <Dialog open={bulkConfirmDialog.open} onOpenChange={(open) => !open && setBulkConfirmDialog({ open: false, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="w-5 h-5" />
              {bulkConfirmDialog.action === 'reset_all_devices' 
                ? 'Resetar Todos os Dispositivos' 
                : 'Suspender Todas as Licenças'}
            </DialogTitle>
            <DialogDescription>
              {bulkConfirmDialog.action === 'reset_all_devices' 
                ? 'Tem certeza que deseja resetar TODOS os dispositivos de TODAS as licenças? Todos os usuários precisarão ativar novamente em seus dispositivos.'
                : 'Tem certeza que deseja SUSPENDER TODAS as licenças ativas? Todos os usuários perderão o acesso imediatamente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
            <p className="text-center text-yellow-500 font-medium">
              ⚠️ Esta ação afetará TODAS as licenças do sistema!
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {bulkConfirmDialog.action === 'reset_all_devices' 
                ? `${summary?.total || 0} licenças serão afetadas`
                : `${summary?.active || 0} licenças ativas serão suspensas`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkConfirmDialog({ open: false, action: null })}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => bulkConfirmDialog.action && executeBulkAction(bulkConfirmDialog.action)}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Details Modal */}
      <DeviceDetailsModal
        isOpen={deviceModal.open}
        onClose={() => setDeviceModal({ open: false, device: null, licenseKey: '' })}
        device={deviceModal.device}
        licenseKey={deviceModal.licenseKey}
      />
    </div>
  );
};

export default LicensesTab;

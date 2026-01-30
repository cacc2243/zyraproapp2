import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LogOut, 
  RefreshCw, 
  Loader2,
  Settings,
  Key,
  Copy,
  Check,
  Receipt,
  Shield,
  Activity,
  CalendarClock
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import TransactionsTab, { Transaction, Summary, DateFilterType, getDateRange } from '@/components/admin/TransactionsTab';
import LicensesTab from '@/components/admin/LicensesTab';
import MonitoringTab from '@/components/admin/MonitoringTab';
import SubscriptionsTab from '@/components/admin/SubscriptionsTab';

type PaymentAPI = 'pepper' | 'pixup';

const Painel = () => {
  const isMobile = useIsMobile();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);
  const [paymentApi, setPaymentApi] = useState<PaymentAPI>('pixup');
  const [savingApi, setSavingApi] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [togglingAccess, setTogglingAccess] = useState(false);
  const [generatingBulkLicenses, setGeneratingBulkLicenses] = useState(false);
  const [generatedLicense, setGeneratedLicense] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [emailFilter, setEmailFilter] = useState('');
  const { toast } = useToast();

  const generateLicense = () => {
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
    
    const license = parts.join('-');
    setGeneratedLicense(license);
    setCopied(false);
  };

  const copyLicense = () => {
    if (generatedLicense) {
      navigator.clipboard.writeText(generatedLicense);
      setCopied(true);
      toast({ title: 'Licença copiada!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // SECURITY: Use sessionStorage instead of localStorage (cleared on tab close)
  const getToken = () => sessionStorage.getItem('admin_token');
  const setToken = (token: string) => sessionStorage.setItem('admin_token', token);
  const removeToken = () => sessionStorage.removeItem('admin_token');

  const fetchApiSetting = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success && data.data?.payment_api) {
        setPaymentApi(data.data.payment_api as PaymentAPI);
      }
    } catch (error) {
      console.error('Error fetching API setting:', error);
    }
  };

  const handleApiChange = async (value: PaymentAPI) => {
    setSavingApi(true);
    try {
      const token = getToken();
      const response = await fetch('https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-settings', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_api: value })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      setPaymentApi(value);
      toast({ 
        title: 'API alterada com sucesso!', 
        description: `Agora usando: ${value === 'pepper' ? 'Pepper' : 'PixUp'}` 
      });
    } catch (error) {
      console.error('Error updating API:', error);
      toast({ title: 'Erro ao alterar API', variant: 'destructive' });
    } finally {
      setSavingApi(false);
    }
  };

  useEffect(() => {
    const verifyTokenOnServer = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await fetch('https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-transactions?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          setIsLoggedIn(true);
          fetchTransactions();
          fetchApiSetting();
        } else {
          removeToken();
        }
      } catch {
        removeToken();
      }
    };

    verifyTokenOnServer();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        setIsLoggedIn(true);
        fetchTransactions();
        fetchApiSetting();
        toast({ title: 'Login realizado com sucesso!' });
      } else {
        toast({ title: 'Credenciais inválidas', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao fazer login', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setTransactions([]);
    setSummary(null);
  };

  const fetchTransactions = async (page = currentPage, searchQuery = emailFilter) => {
    setLoading(true);
    try {
      const token = getToken();
      const { from, to } = getDateRange(dateFilter, customDateFrom, customDateTo);
      
      const params = new URLSearchParams({
        date_from: from.toISOString(),
        date_to: to.toISOString(),
        page: page.toString(),
        limit: '50',
      });
      
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const response = await fetch(
        `https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-transactions?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      
      if (data.success && (data.data || data.transactions)) {
        setTransactions(data.data || data.transactions);
        setSummary(data.summary);
        setTotalItems(data.pagination?.total || data.data?.length || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setCurrentPage(page);
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar transações', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSearch = () => {
    setCurrentPage(1);
    fetchTransactions(1, emailFilter);
  };

  useEffect(() => {
    if (isLoggedIn) {
      setCurrentPage(1);
      fetchTransactions(1);
    }
  }, [statusFilter, dateFilter, customDateFrom, customDateTo]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchTransactions(newPage);
    }
  };

  const handleToggleAccess = async (grantAccess: boolean) => {
    if (selectedIds.length === 0) return;
    
    setTogglingAccess(true);
    try {
      const token = getToken();
      const response = await fetch('https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/toggle-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transaction_ids: selectedIds, grant_access: grantAccess })
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: `Acesso ${grantAccess ? 'liberado' : 'bloqueado'} com sucesso!` });
        setSelectedIds([]);
        fetchTransactions();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: 'Erro ao alterar acesso', variant: 'destructive' });
    } finally {
      setTogglingAccess(false);
    }
  };

  const handleBulkGenerateLicenses = async () => {
    if (selectedIds.length === 0) return;
    
    setGeneratingBulkLicenses(true);
    try {
      const token = getToken();
      const response = await fetch('https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/bulk-generate-licenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transaction_ids: selectedIds })
      });

      const data = await response.json();
      if (data.success) {
        toast({ 
          title: 'Licenças geradas!', 
          description: data.message 
        });
        setSelectedIds([]);
        fetchTransactions();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: 'Erro ao gerar licenças', variant: 'destructive' });
    } finally {
      setGeneratingBulkLicenses(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 bg-card border-border">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-muted-foreground">ZYRA Pro</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-muted-foreground">ZYRA Pro</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isMobile && (
              <Select value={paymentApi} onValueChange={(v) => handleApiChange(v as PaymentAPI)} disabled={savingApi}>
                <SelectTrigger className="w-[140px] bg-card border-border">
                  <Settings className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pepper">Pepper</SelectItem>
                  <SelectItem value="pixup">PixUp</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={() => fetchTransactions(currentPage)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {!isMobile && <span className="ml-2">Atualizar</span>}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>

        {/* License Generator */}
        <Card className="p-4 bg-card border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Gerador de Licença</h2>
            </div>
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <Input 
                value={generatedLicense} 
                readOnly 
                placeholder="Clique em gerar..." 
                className="bg-background font-mono flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={copyLicense} 
                disabled={!generatedLicense}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button onClick={generateLicense}>
                <Key className="w-4 h-4 mr-2" />
                Gerar
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Receipt className="w-4 h-4 mr-2" />
              {!isMobile && 'Transações'}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CalendarClock className="w-4 h-4 mr-2" />
              {!isMobile && 'Assinaturas'}
            </TabsTrigger>
            <TabsTrigger value="licenses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4 mr-2" />
              {!isMobile && 'Licenças'}
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="w-4 h-4 mr-2" />
              {!isMobile && 'Monitoramento'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            <TransactionsTab
              transactions={transactions}
              summary={summary}
              loading={loading}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              customDateFrom={customDateFrom}
              setCustomDateFrom={setCustomDateFrom}
              customDateTo={customDateTo}
              setCustomDateTo={setCustomDateTo}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              togglingAccess={togglingAccess}
              handleToggleAccess={handleToggleAccess}
              generatingBulkLicenses={generatingBulkLicenses}
              handleBulkGenerateLicenses={handleBulkGenerateLicenses}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onRefresh={() => fetchTransactions(currentPage)}
              emailFilter={emailFilter}
              setEmailFilter={setEmailFilter}
              onEmailSearch={handleEmailSearch}
            />
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            <SubscriptionsTab />
          </TabsContent>

          <TabsContent value="licenses" className="mt-4">
            <LicensesTab />
          </TabsContent>

          <TabsContent value="monitoring" className="mt-4">
            <MonitoringTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Painel;

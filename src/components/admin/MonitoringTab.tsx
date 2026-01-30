import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Shield, 
  ShieldAlert, 
  ShieldX, 
  Wifi,
  Clock,
  AlertTriangle,
  Activity,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActiveSession {
  id: string;
  session_token: string;
  device_fingerprint: string;
  ip_address: string | null;
  integrity_hash: string;
  created_at: string;
  last_heartbeat: string | null;
  expires_at: string;
  license_id: string | null;
  licenses: {
    license_key: string;
    status: string;
    transaction_id: string | null;
    transactions: {
      customer_name: string;
      customer_email: string;
    } | null;
  } | null;
}

interface IntegrityViolation {
  id: string;
  license_key: string;
  action: string;
  device_fingerprint: string | null;
  ip_address: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  violation_count: number;
}

interface RateLimitAlert {
  count: number;
  ip: string;
  endpoint: string;
  lastSeen: string;
}

interface ExtensionLog {
  id: string;
  license_key: string | null;
  log_type: string;
  message: string;
  metadata: Record<string, any> | null;
  device_fingerprint: string | null;
  created_at: string;
}

interface MonitoringSummary {
  active_sessions: number;
  integrity_violations_24h: number;
  rate_limit_alerts: number;
  auto_suspended: number;
  extension_logs_1h: number;
  proxy_errors_1h: number;
  timestamp: string;
}

const actionLabels: Record<string, { label: string; severity: 'low' | 'medium' | 'high' }> = {
  'integrity_violation': { label: 'Violação de Integridade', severity: 'high' },
  'invalid_signature': { label: 'Assinatura Inválida', severity: 'high' },
  'tampered_extension': { label: 'Extensão Modificada', severity: 'high' },
  'debug_detected': { label: 'Debug Detectado', severity: 'medium' },
  'session_invalidated': { label: 'Sessão Invalidada', severity: 'medium' },
  'unknown_hash_blocked': { label: 'Hash Desconhecido', severity: 'high' },
  'validation_failed': { label: 'Validação Falhou', severity: 'low' },
  'auto_suspended': { label: 'Auto-Suspensa', severity: 'high' },
};

const severityColors: Record<string, string> = {
  low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const MonitoringTab = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [violations, setViolations] = useState<IntegrityViolation[]>([]);
  const [ratelimits, setRatelimits] = useState<RateLimitAlert[]>([]);
  const [extensionLogs, setExtensionLogs] = useState<ExtensionLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState('sessions');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const getToken = () => sessionStorage.getItem('admin_token');

  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        'https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/admin-monitoring',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
        setSessions(data.data.sessions || []);
        setViolations(data.data.violations || []);
        setRatelimits(data.data.ratelimits || []);
        setExtensionLogs(data.data.extensionLogs || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar monitoramento', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM HH:mm:ss", { locale: ptBR });
  };

  const truncate = (str: string, len: number) => {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Wifi className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{summary.active_sessions}</p>
                <p className="text-xs text-muted-foreground">Sessões Ativas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{summary.integrity_violations_24h}</p>
                <p className="text-xs text-muted-foreground">Violações (24h)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{summary.rate_limit_alerts}</p>
                <p className="text-xs text-muted-foreground">Alertas Rate Limit</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Atualizado: {summary ? formatDate(summary.timestamp) : '-'}
        </p>
        <Button variant="outline" size="sm" onClick={fetchMonitoringData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Sub Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="sessions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Wifi className="w-4 h-4 mr-2" />
            Sessões ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="violations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ShieldX className="w-4 h-4 mr-2" />
            Violações ({violations.length})
          </TabsTrigger>
          <TabsTrigger value="ratelimits" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="w-4 h-4 mr-2" />
            Rate Limits ({ratelimits.length})
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="w-4 h-4 mr-2" />
            Logs ({extensionLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Sessions */}
        <TabsContent value="sessions" className="mt-4">
          <Card className="bg-card border-border overflow-hidden">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Wifi className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma sessão ativa no momento</p>
              </div>
            ) : isMobile ? (
              <div className="divide-y divide-border">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-primary">
                        {session.licenses?.license_key || 'Sem licença'}
                      </span>
                      <Badge className={session.licenses?.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {session.licenses?.status || 'N/A'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {session.licenses?.transactions?.customer_name || 'Cliente desconhecido'}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>IP: {session.ip_address || 'Desconhecido'}</p>
                      <p>Device: {truncate(session.device_fingerprint, 12)}</p>
                      <p>Último heartbeat: {formatDate(session.last_heartbeat)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Licença</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Último Heartbeat</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id} className="border-border">
                      <TableCell className="text-sm font-medium">
                        {session.licenses?.transactions?.customer_name || 'Desconhecido'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {session.licenses?.license_key || 'Sem licença'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {session.ip_address || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {truncate(session.device_fingerprint, 16)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(session.last_heartbeat)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(session.expires_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className={session.licenses?.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                          {session.licenses?.status || 'N/A'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Integrity Violations */}
        <TabsContent value="violations" className="mt-4">
          <Card className="bg-card border-border overflow-hidden">
            {violations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>Nenhuma violação detectada nas últimas 24h</p>
              </div>
            ) : isMobile ? (
              <div className="divide-y divide-border">
                {violations.map((violation) => {
                  const actionInfo = actionLabels[violation.action] || { label: violation.action, severity: 'low' };
                  return (
                    <div key={violation.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={severityColors[actionInfo.severity]}>
                          {actionInfo.label}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {violation.violation_count > 4 && (
                            <Badge className="bg-red-600/30 text-red-400 border-red-500/50">
                              {violation.violation_count}x ⚠️
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(violation.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {violation.customer_name || 'Cliente desconhecido'}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Licença: {violation.license_key}</p>
                        <p>IP: {violation.ip_address || 'Desconhecido'}</p>
                        <p>Device: {truncate(violation.device_fingerprint || '', 12)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Licença</TableHead>
                    <TableHead>Violações</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((violation) => {
                    const actionInfo = actionLabels[violation.action] || { label: violation.action, severity: 'low' };
                    return (
                      <TableRow key={violation.id} className="border-border">
                        <TableCell>
                          <Badge className={severityColors[actionInfo.severity]}>
                            {actionInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {violation.customer_name || 'Desconhecido'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {violation.license_key}
                        </TableCell>
                        <TableCell>
                          <Badge className={violation.violation_count > 4 ? 'bg-red-600/30 text-red-400' : 'bg-muted text-muted-foreground'}>
                            {violation.violation_count}x
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {violation.ip_address || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(violation.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Rate Limit Alerts */}
        <TabsContent value="ratelimits" className="mt-4">
          <Card className="bg-card border-border overflow-hidden">
            {ratelimits.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>Nenhum alerta de rate limit na última hora</p>
              </div>
            ) : isMobile ? (
              <div className="divide-y divide-border">
                {ratelimits.map((rl, idx) => (
                  <div key={idx} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{rl.ip}</span>
                      <Badge className={rl.count >= 20 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}>
                        {rl.count} req
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Endpoint: {rl.endpoint}</p>
                      <p>Última: {formatDate(rl.lastSeen)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>IP</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Requisições (1h)</TableHead>
                    <TableHead>Última Atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratelimits.map((rl, idx) => (
                    <TableRow key={idx} className="border-border">
                      <TableCell className="font-mono text-sm">{rl.ip}</TableCell>
                      <TableCell className="text-sm">{rl.endpoint}</TableCell>
                      <TableCell>
                        <Badge className={rl.count >= 20 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}>
                          {rl.count} requisições
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(rl.lastSeen)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Extension Logs */}
        <TabsContent value="logs" className="mt-4">
          <Card className="bg-card border-border overflow-hidden">
            {extensionLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>Nenhum log registrado na última hora</p>
              </div>
            ) : isMobile ? (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {extensionLogs.map((log) => (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.log_type === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : log.log_type === 'error' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-500" />
                        )}
                        <Badge className={
                          log.log_type === 'success' ? 'bg-green-500/20 text-green-400' :
                          log.log_type === 'error' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }>
                          {log.log_type}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{log.message}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Licença: {log.license_key || '-'}</p>
                      {log.metadata?.projectId && <p>Projeto: {truncate(log.metadata.projectId, 20)}</p>}
                      {log.metadata?.combination && <p>Endpoint: {log.metadata.combination}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Tipo</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Licença</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extensionLogs.map((log) => (
                      <TableRow key={log.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.log_type === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : log.log_type === 'error' ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Info className="w-4 h-4 text-blue-500" />
                            )}
                            <Badge className={
                              log.log_type === 'success' ? 'bg-green-500/20 text-green-400' :
                              log.log_type === 'error' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }>
                              {log.log_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {log.message}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.license_key || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.metadata?.projectId ? truncate(log.metadata.projectId, 12) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(log.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringTab;

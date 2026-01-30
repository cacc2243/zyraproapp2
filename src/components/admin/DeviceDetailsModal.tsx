import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Smartphone, 
  Monitor, 
  Globe, 
  Clock, 
  Cpu, 
  HardDrive,
  Maximize2,
  Palette,
  Wifi
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface Device {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  is_active: boolean;
  first_seen_at: string;
  last_seen_at: string;
  ip_address: string | null;
  device_info?: DeviceInfo;
}

interface DeviceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  licenseKey: string;
}

const DeviceDetailsModal = ({ isOpen, onClose, device, licenseKey }: DeviceDetailsModalProps) => {
  if (!device) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const parseUserAgent = (ua?: string) => {
    if (!ua) return { browser: 'Desconhecido', os: 'Desconhecido' };
    
    let browser = 'Desconhecido';
    let os = 'Desconhecido';

    // Detect browser
    if (ua.includes('Chrome/')) {
      const match = ua.match(/Chrome\/([\d.]+)/);
      browser = `Chrome ${match?.[1] || ''}`;
    } else if (ua.includes('Firefox/')) {
      const match = ua.match(/Firefox\/([\d.]+)/);
      browser = `Firefox ${match?.[1] || ''}`;
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      const match = ua.match(/Version\/([\d.]+)/);
      browser = `Safari ${match?.[1] || ''}`;
    } else if (ua.includes('Edge/')) {
      const match = ua.match(/Edge\/([\d.]+)/);
      browser = `Edge ${match?.[1] || ''}`;
    }

    // Detect OS
    if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
    else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (ua.includes('Mac OS X')) {
      const match = ua.match(/Mac OS X ([\d_]+)/);
      os = `macOS ${match?.[1]?.replace(/_/g, '.') || ''}`;
    }
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return { browser, os };
  };

  const info = device.device_info || {};
  const { browser, os } = parseUserAgent(info.userAgent);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Detalhes do Dispositivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className={device.is_active 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border-red-500/30'}>
              {device.is_active ? 'Ativo' : 'Desativado'}
            </Badge>
          </div>

          {/* Fingerprint */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Fingerprint</span>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {device.device_fingerprint}
            </code>
          </div>

          {/* License */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Licença</span>
            <code className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-mono">
              {licenseKey}
            </code>
          </div>

          {/* Dates */}
          <Card className="p-3 bg-muted/50 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                Primeira ativação
              </span>
              <span>{formatDate(device.first_seen_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                Último acesso
              </span>
              <span>{formatDate(device.last_seen_at)}</span>
            </div>
          </Card>

          {/* Device Info */}
          {Object.keys(info).length > 0 ? (
            <Card className="p-3 bg-muted/50 space-y-3">
              <h4 className="font-medium text-sm">Informações do Sistema</h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Sistema</p>
                    <p>{os}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Navegador</p>
                    <p>{browser}</p>
                  </div>
                </div>

                {info.hardwareConcurrency && (
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">CPU Cores</p>
                      <p>{info.hardwareConcurrency}</p>
                    </div>
                  </div>
                )}

                {info.deviceMemory && (
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Memória</p>
                      <p>{info.deviceMemory} GB</p>
                    </div>
                  </div>
                )}

                {info.screen && (
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Resolução</p>
                      <p>{info.screen}</p>
                    </div>
                  </div>
                )}

                {info.colorDepth && (
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Color Depth</p>
                      <p>{info.colorDepth} bits</p>
                    </div>
                  </div>
                )}

                {info.timezone && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Timezone</p>
                      <p>{info.timezone}</p>
                    </div>
                  </div>
                )}

                {info.language && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Idioma</p>
                      <p>{info.language}</p>
                    </div>
                  </div>
                )}

                {info.platform && (
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Plataforma</p>
                      <p>{info.platform}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-muted/50 text-center text-muted-foreground text-sm">
              <p>Informações detalhadas do dispositivo não disponíveis.</p>
              <p className="text-xs mt-1">Será coletado na próxima validação com a extensão atualizada.</p>
            </Card>
          )}

          {/* IP */}
          {device.ip_address && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wifi className="w-4 h-4" />
                IP
              </span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {device.ip_address}
              </code>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailsModal;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Key, Sparkles, Copy, Check, ExternalLink, ChevronRight, Layout, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

const freeResources = [
  {
    id: 'api-keys',
    title: 'Free API Keys',
    description: 'Chaves de API gratuitas',
    url: 'unsecuredapikeys.com',
    icon: Key,
  },
  {
    id: 'tools',
    title: 'IAs & Ferramentas Free',
    description: 'Várias ferramentas gratuitas',
    url: 'toolfk.com',
    icon: Sparkles,
  },
  {
    id: 'components',
    title: 'Melhore suas páginas/apps',
    description: 'Componentes de alta qualidade',
    url: '21st.dev/community/components',
    icon: Layout,
  },
  {
    id: 'prompts',
    title: 'Milhares de prompts grátis',
    description: 'Prompts para IA',
    url: 'prompthero.com',
    icon: MessageSquareText,
  },
];

const FreeSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenUrl = (url: string) => {
    window.open(`https://${url}`, '_blank');
  };

  return (
    <div 
      className="fixed left-0 top-1/2 -translate-y-1/2 z-30"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <motion.div
        initial={false}
        animate={{ 
          width: isExpanded ? 320 : 56,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
        className="relative overflow-hidden"
      >
        {/* Glass Panel */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-r-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Collapsed State - Just Icon */}
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="p-4 cursor-pointer"
                onClick={() => setIsExpanded(true)}
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2" />
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="p-5"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-foreground">Conteúdo Grátis</h3>
                    <p className="text-xs text-muted-foreground">Recursos exclusivos</p>
                  </div>
                </div>

                {/* Resources List */}
                <div className="space-y-4">
                  {freeResources.map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      className="group"
                    >
                      {/* Resource Header */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <resource.icon className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">{resource.title}</span>
                      </div>

                      {/* Code Box */}
                      <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                        <code className="text-sm text-primary/90 font-mono flex-1 truncate">
                          {resource.url}
                        </code>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(resource.url, resource.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-white/10"
                          >
                            {copiedId === resource.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenUrl(resource.url)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-white/10"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer Hint */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  <p className="text-xs text-muted-foreground text-center">
                    Dica: Explore esses recursos!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 -z-10 opacity-50">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-20 h-20 bg-primary/20 rounded-full blur-xl" />
        </div>
      </motion.div>
    </div>
  );
};

export default FreeSidebar;

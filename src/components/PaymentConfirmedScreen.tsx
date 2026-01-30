import { CheckCircle, Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

interface PaymentConfirmedScreenProps {
  email: string;
}

const PaymentConfirmedScreen = ({ email }: PaymentConfirmedScreenProps) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Wistia player script
    const playerScript = document.createElement('script');
    playerScript.src = 'https://fast.wistia.com/player.js';
    playerScript.async = true;
    document.head.appendChild(playerScript);

    // Load specific video module
    const embedScript = document.createElement('script');
    embedScript.src = 'https://fast.wistia.com/embed/gplswog0ws.js';
    embedScript.async = true;
    embedScript.type = 'module';
    document.head.appendChild(embedScript);

    return () => {
      // Cleanup scripts on unmount
      document.head.removeChild(playerScript);
      document.head.removeChild(embedScript);
    };
  }, []);

  return (
    <div className="text-center py-6 space-y-6">
      {/* Success Icon */}
      <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-primary" />
      </div>

      {/* Thank You Message */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          🎉 Pagamento Confirmado!
        </h3>
        <p className="text-white/80">
          Obrigado pela sua compra!
        </p>
      </div>

      {/* Warning Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <p className="text-sm text-yellow-400 font-semibold uppercase tracking-wide mb-1">
          ⚠️ ATENÇÃO
        </p>
        <p className="text-sm text-white/80">
          Assista o vídeo abaixo para saber como acessar sua licença.
        </p>
      </div>

      {/* Video Section */}
      <div className="space-y-4 pt-4">
        {/* Section Header */}
        <div className="flex items-center justify-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          <h4 className="text-lg font-semibold text-white uppercase tracking-wide">
            Veja como acessar
          </h4>
        </div>

        {/* Wistia Video Player */}
        <div 
          ref={videoContainerRef}
          className="relative rounded-xl overflow-hidden border border-white/10"
        >
          <style>
            {`
              wistia-player[media-id='gplswog0ws']:not(:defined) { 
                background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/gplswog0ws/swatch'); 
                display: block; 
                filter: blur(5px); 
                padding-top: 56.25%; 
              }
            `}
          </style>
          {/* @ts-ignore - Custom Wistia element */}
          <wistia-player media-id="gplswog0ws" aspect="1.7777777777777777"></wistia-player>
        </div>
      </div>

      {/* Access Members Area Button */}
      <div className="pt-4">
        <Button
          asChild
          className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-xl shadow-lg shadow-primary/25"
        >
          <Link to="/membros">
            Acessar Área de Membros
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
        
      </div>
    </div>
  );
};

export default PaymentConfirmedScreen;

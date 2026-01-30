import { LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import zyraLogoSmall from "@/assets/zyra-logo-small.png";
import lovableColorIcon from "@/assets/lovable-color-icon.png";
import v0IconWhite from "@/assets/v0-icon-white.png";
import manusIcon from "@/assets/ico-manus-2.png";

interface StickyBarProps {
  onOpenAuth?: () => void;
}

const StickyBar = ({ onOpenAuth }: StickyBarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenAuth = () => {
    if (onOpenAuth) {
      onOpenAuth();
    }
  };

  return (
    <>
      {/* Glow light effect attached to top bar */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        style={{
          width: '500px',
          height: '200px',
          background: 'radial-gradient(ellipse 100% 100% at 50% 0%, hsl(252 80% 65% / 0.4) 0%, hsl(254 70% 60% / 0.15) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      
      <div 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: isScrolled 
            ? 'linear-gradient(135deg, rgba(128, 101, 243, 0.35) 0%, rgba(109, 78, 216, 0.25) 50%, rgba(168, 147, 249, 0.3) 100%)' 
            : 'linear-gradient(135deg, #8065f3 0%, #6d4ed8 40%, #9b7bf7 70%, #a893f9 100%)',
          backdropFilter: isScrolled ? 'blur(24px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(24px) saturate(180%)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
          boxShadow: isScrolled 
            ? '0 4px 30px rgba(128, 101, 243, 0.15)' 
            : '0 2px 20px rgba(128, 101, 243, 0.3)',
        }}
      >
      <div className="container py-2">
        <div className="flex items-center justify-center gap-2">
          {isScrolled ? (
            <div className="flex items-center justify-between w-full max-w-md">
              <img 
                src={zyraLogoSmall} 
                alt="Zyra" 
                className="h-7 w-auto"
              />
              <button 
                onClick={handleOpenAuth}
                className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <LogIn className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">
                  Área de membros
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 text-sm text-white font-light">
              <div className="flex items-center gap-1">
                <img src={lovableColorIcon} alt="Lovable" className="w-4 h-4 object-contain" />
                <span>Lovable</span>
              </div>
              <span className="text-white/50">,</span>
              <div className="flex items-center gap-1">
                <img src={v0IconWhite} alt="V0" className="w-4 h-4 object-contain" />
                <span>V0</span>
              </div>
              <span className="text-white/50">e</span>
              <div className="flex items-center gap-1">
                <img src={manusIcon} alt="Manus" className="w-4 h-4 object-contain" />
                <span>Manus</span>
              </div>
              <span className="font-medium">Ilimitados</span>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default StickyBar;

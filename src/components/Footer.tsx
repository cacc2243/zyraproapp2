import zyraLogo from "@/assets/logo-zyra.png";

const Footer = () => {
  return (
    <footer className="py-4 border-t border-border/20 bg-card/30">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-3">
          {/* Logo */}
          <img src={zyraLogo} alt="Zyra Pro" className="h-5 w-auto opacity-60" />
          
          {/* Links */}
          <div className="flex items-center gap-3 text-xs">
            <a 
              href="https://www.instagram.com/ads.sand/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Instagram
            </a>
          </div>
          
          {/* Copyright */}
          <p className="text-[10px] text-muted-foreground/50">
            © 2025 Zyra Pro
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
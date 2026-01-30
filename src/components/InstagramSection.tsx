import { Instagram } from "lucide-react";
import instagramProfile from "@/assets/instagram-profile-ads.png";

const InstagramSection = () => {
  return (
    <div className="mt-16 md:mt-24">
      <div className="max-w-md mx-auto text-center">
        {/* Title */}
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Siga-me no Instagram!
        </h3>
        <p className="text-muted-foreground text-sm sm:text-base mb-6">
          Conteúdo exclusivo e atualizações
        </p>

        {/* Profile Card */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <img
            src={instagramProfile}
            alt="Perfil Instagram @ads.sand"
            className="w-full h-auto rounded-2xl"
          />
          
          {/* Gradient overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Glass Button */}
        <a
          href="https://www.instagram.com/ads.sand/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Instagram className="w-5 h-5 text-pink-400" />
          <span className="text-foreground">Seguir @ads.sand</span>
        </a>
      </div>
    </div>
  );
};

export default InstagramSection;

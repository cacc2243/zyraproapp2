import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import StickyBar from "@/components/StickyBar";
import HeroSection from "@/components/HeroSection";
import ProductShowcase from "@/components/ProductShowcase";
import PricingSection from "@/components/PricingSection";
import TargetAudienceSection from "@/components/TargetAudienceSection";
import Footer from "@/components/Footer";
import CinematicBackground from "@/components/CinematicBackground";
import AuthDrawer from "@/components/AuthDrawer";
import { trackViewContent } from "@/hooks/useFacebookPixel";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    trackViewContent('Página Inicial');
  }, []);

  // Check for auth=open parameter to auto-open drawer
  useEffect(() => {
    if (searchParams.get("auth") === "open") {
      setIsAuthDrawerOpen(true);
      // Clean up the URL
      searchParams.delete("auth");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleAuthSuccess = () => {
    setIsAuthDrawerOpen(false);
    navigate("/membros");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <CinematicBackground />
      <StickyBar onOpenAuth={() => setIsAuthDrawerOpen(true)} />
      <main className="pt-10 relative z-10">
        <HeroSection />
        <ProductShowcase />
        <PricingSection />
        <TargetAudienceSection />
        
      </main>
      <div className="relative z-10">
        <Footer />
      </div>

      {/* Auth Drawer */}
      <AuthDrawer 
        isOpen={isAuthDrawerOpen}
        onClose={() => setIsAuthDrawerOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;

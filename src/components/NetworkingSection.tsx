import { Users, Zap, Rocket, TrendingUp, Sparkles, Code, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import networkingGroup from "@/assets/networking-group.png";
import instagramProfile from "@/assets/instagram-profile.jpg";
const topics = [{
  icon: TrendingUp,
  label: "Facebook Ads"
}, {
  icon: Zap,
  label: "Google Ads"
}, {
  icon: Rocket,
  label: "Ofertas Escaladas"
}, {
  icon: Sparkles,
  label: "Hacks Exclusivos"
}, {
  icon: Code,
  label: "Método Lovable"
}, {
  icon: Code,
  label: "Método V0.dev",
  badge: "Em breve"
}, {
  icon: Code,
  label: "Método Bolt.new",
  badge: "Em breve"
}];
const NetworkingSection = () => {
  return <section className="relative overflow-hidden py-10 sm:py-14 lg:py-20">
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <div className="badge-premium mb-3 sm:mb-4 mx-auto w-fit">
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Bônus Exclusivo
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
            Acesse nosso <span className="text-gradient">Grupo de Networking</span>
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-md mx-auto px-2">
            Nosso grupo de Networking onde você vai encontrar e ficar a par de tudo sobre o marketing digital e plataformas.
          </p>
        </div>

        <div className="max-w-lg mx-auto space-y-6">
          {/* Networking Group Card */}
          <div className="card-premium rounded-xl sm:rounded-2xl overflow-hidden">
            {/* Group Image */}
            <div className="bg-secondary p-3 sm:p-4 border-b border-border/40">
              <img src={networkingGroup} alt="Networking PRO - Grupo VIP" className="w-full rounded-lg" />
            </div>

            <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
              {/* Description */}
              <div className="text-center">
                <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-1.5 sm:mb-2">
                  Networking - PRO
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Conteúdo completo sobre marketing digital em todos os níveis
                </p>
              </div>

              {/* Topics */}
              <div className="space-y-2.5 sm:space-y-3">
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  O que você encontra no grupo:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {topics.map((topic, i) => <div key={i} className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 lg:p-3 bg-secondary rounded-lg border border-border/40">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                        <topic.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="sm:text-sm font-medium leading-snug block text-sm">
                          {topic.label}
                        </span>
                        {topic.badge}
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Bottom note */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 lg:p-4 bg-primary/10 rounded-lg sm:rounded-xl border border-primary/20">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                <p className="text-[11px] sm:text-xs lg:text-sm text-foreground">
                  <strong>E muito mais!</strong> Novos conteúdos e métodos adicionados toda semana.
                </p>
              </div>
            </div>
          </div>

          {/* Instagram Card */}
          <div className="card-premium rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Profile Image */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                    <img src={instagramProfile} alt="@ads.sand" className="w-full h-full rounded-full object-cover border-2 border-background" />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    <span className="text-xs text-muted-foreground">Instagram</span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-foreground">@ads.sand</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Siga para mais conteúdo</p>
                </div>

                {/* Follow Button */}
                <Button size="sm" className="shrink-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-semibold px-4 sm:px-6" asChild>
                  <a href="https://www.instagram.com/ads.sand/" target="_blank" rel="noopener noreferrer">
                    Seguir
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default NetworkingSection;
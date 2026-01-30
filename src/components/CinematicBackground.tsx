import { useEffect, useRef } from 'react';

const CinematicBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subtle parallax effect on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const xOffset = (clientX / innerWidth - 0.5) * 8;
      const yOffset = (clientY / innerHeight - 0.5) * 8;
      
      const lights = containerRef.current.querySelectorAll('.volumetric-light');
      lights.forEach((light, index) => {
        const element = light as HTMLElement;
        const multiplier = (index + 1) * 0.3;
        element.style.transform = `translate(${xOffset * multiplier}px, ${yOffset * multiplier}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, overflow: 'hidden', maxWidth: '100vw' }}>
      {/* Base layer - deep near-black with stronger purple undertone */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 130% 90% at 50% 0%, 
              hsl(260 50% 12% / 1) 0%, 
              hsl(260 40% 7% / 1) 35%, 
              hsl(260 30% 3% / 1) 100%
            )
          `,
        }}
      />

      {/* Layered darkness - ambient occlusion inspired */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 50% 100%, 
              hsl(260 60% 4% / 0.95) 0%, 
              transparent 65%
            ),
            radial-gradient(ellipse 70% 60% at 0% 50%, 
              hsl(260 60% 4% / 0.8) 0%, 
              transparent 55%
            ),
            radial-gradient(ellipse 70% 60% at 100% 50%, 
              hsl(260 60% 4% / 0.8) 0%, 
              transparent 55%
            )
          `,
        }}
      />

      {/* Volumetric light accent - top center - MUCH STRONGER */}
      <div 
        className="volumetric-light absolute transition-transform duration-[2000ms] ease-out"
        style={{
          top: '-5%',
          left: '20%',
          width: '60%',
          height: '70%',
          background: `
            radial-gradient(ellipse 100% 100% at 50% 0%, 
              hsl(252 80% 60% / 0.37) 0%, 
              hsl(252 70% 50% / 0.18) 40%, 
              transparent 70%
            )
          `,
          filter: 'blur(60px)',
        }}
      />

      {/* Volumetric light accent - left side - MUCH STRONGER */}
      <div 
        className="volumetric-light absolute transition-transform duration-[2500ms] ease-out"
        style={{
          top: '10%',
          left: '-10%',
          width: '50%',
          height: '60%',
          background: `
            radial-gradient(ellipse 100% 100% at 0% 50%, 
              hsl(254 70% 55% / 0.26) 0%, 
              transparent 55%
            )
          `,
          filter: 'blur(70px)',
        }}
      />

      {/* Volumetric light accent - right side - MUCH STRONGER */}
      <div 
        className="volumetric-light absolute transition-transform duration-[2200ms] ease-out"
        style={{
          top: '30%',
          right: '-10%',
          width: '45%',
          height: '55%',
          background: `
            radial-gradient(ellipse 100% 100% at 100% 50%, 
              hsl(260 65% 50% / 0.23) 0%, 
              transparent 55%
            )
          `,
          filter: 'blur(65px)',
        }}
      />

      {/* Additional volumetric glow - bottom center */}
      <div 
        className="volumetric-light absolute transition-transform duration-[2800ms] ease-out"
        style={{
          bottom: '-10%',
          left: '30%',
          width: '40%',
          height: '50%',
          background: `
            radial-gradient(ellipse 100% 100% at 50% 100%, 
              hsl(256 70% 55% / 0.18) 0%, 
              transparent 60%
            )
          `,
          filter: 'blur(60px)',
        }}
      />

      {/* Soft rim light glow - top sections - STRONGER */}
      <div 
        className="absolute"
        style={{
          top: '3%',
          left: '15%',
          width: '70%',
          height: '4px',
          background: `
            linear-gradient(90deg, 
              transparent 0%, 
              hsl(252 80% 65% / 0.30) 25%, 
              hsl(252 80% 70% / 0.53) 50%, 
              hsl(252 80% 65% / 0.30) 75%, 
              transparent 100%
            )
          `,
          filter: 'blur(15px)',
        }}
      />

      {/* Additional rim light - mid page */}
      <div 
        className="absolute"
        style={{
          top: '45%',
          left: '10%',
          width: '80%',
          height: '3px',
          background: `
            linear-gradient(90deg, 
              transparent 0%, 
              hsl(254 70% 60% / 0.14) 30%, 
              hsl(254 70% 60% / 0.23) 50%, 
              hsl(254 70% 60% / 0.14) 70%, 
              transparent 100%
            )
          `,
          filter: 'blur(20px)',
        }}
      />

      {/* Bokeh particles - MUCH STRONGER */}
      <div className="absolute inset-0">
        {/* Top left corner */}
        <div 
          className="absolute animate-bokeh-drift-1"
          style={{
            top: '8%',
            left: '5%',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'hsl(252 80% 78% / 0.6)',
            filter: 'blur(3px)',
            boxShadow: '0 0 25px 10px hsl(252 80% 72% / 0.37)',
          }}
        />
        <div 
          className="absolute animate-bokeh-drift-2"
          style={{
            top: '15%',
            left: '12%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'hsl(260 70% 72% / 0.53)',
            filter: 'blur(2px)',
            boxShadow: '0 0 18px 6px hsl(260 70% 68% / 0.30)',
          }}
        />
        
        {/* Top right corner */}
        <div 
          className="absolute animate-bokeh-drift-3"
          style={{
            top: '6%',
            right: '8%',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'hsl(254 75% 75% / 0.35)',
            filter: 'blur(3.5px)',
            boxShadow: '0 0 30px 12px hsl(254 75% 70% / 0.2)',
          }}
        />
        <div 
          className="absolute animate-bokeh-drift-1"
          style={{
            top: '18%',
            right: '15%',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'hsl(252 80% 78% / 0.3)',
            filter: 'blur(2px)',
            boxShadow: '0 0 15px 5px hsl(252 80% 72% / 0.15)',
          }}
        />

        {/* Bottom left */}
        <div 
          className="absolute animate-bokeh-drift-2"
          style={{
            bottom: '15%',
            left: '8%',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'hsl(258 70% 72% / 0.35)',
            filter: 'blur(2.5px)',
            boxShadow: '0 0 20px 8px hsl(258 70% 68% / 0.18)',
          }}
        />

        {/* Bottom right */}
        <div 
          className="absolute animate-bokeh-drift-3"
          style={{
            bottom: '10%',
            right: '6%',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: 'hsl(252 75% 74% / 0.38)',
            filter: 'blur(3px)',
            boxShadow: '0 0 25px 10px hsl(252 75% 70% / 0.2)',
          }}
        />

        {/* Mid section particles */}
        <div 
          className="absolute animate-bokeh-drift-1"
          style={{
            top: '35%',
            left: '3%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'hsl(256 70% 72% / 0.3)',
            filter: 'blur(2px)',
            boxShadow: '0 0 15px 5px hsl(256 70% 68% / 0.15)',
          }}
        />
        <div 
          className="absolute animate-bokeh-drift-2"
          style={{
            top: '55%',
            right: '4%',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'hsl(254 75% 73% / 0.35)',
            filter: 'blur(3px)',
            boxShadow: '0 0 22px 8px hsl(254 75% 70% / 0.18)',
          }}
        />
        
        {/* Additional particles for more depth */}
        <div 
          className="absolute animate-bokeh-drift-3"
          style={{
            top: '45%',
            left: '92%',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'hsl(252 65% 70% / 0.28)',
            filter: 'blur(1.5px)',
            boxShadow: '0 0 12px 4px hsl(252 65% 68% / 0.12)',
          }}
        />
        <div 
          className="absolute animate-bokeh-drift-1"
          style={{
            top: '70%',
            left: '6%',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'hsl(260 70% 73% / 0.32)',
            filter: 'blur(2px)',
            boxShadow: '0 0 18px 6px hsl(260 70% 70% / 0.15)',
          }}
        />
        
        {/* Extra corner accents */}
        <div 
          className="absolute animate-bokeh-drift-2"
          style={{
            top: '25%',
            left: '2%',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'hsl(254 65% 70% / 0.25)',
            filter: 'blur(1.5px)',
          }}
        />
        <div 
          className="absolute animate-bokeh-drift-3"
          style={{
            top: '80%',
            right: '10%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'hsl(256 70% 72% / 0.3)',
            filter: 'blur(2px)',
            boxShadow: '0 0 14px 5px hsl(256 70% 68% / 0.12)',
          }}
        />
      </div>

      {/* Vignette overlay - STRONGER */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 65% 55% at 50% 50%, 
              transparent 0%, 
              hsl(260 40% 2% / 0.5) 65%, 
              hsl(260 40% 1% / 0.85) 100%
            )
          `,
        }}
      />

      {/* Subtle grid texture - gradient faded - STRONGER */}
      <div 
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(252 70% 65%) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(252 70% 65%) 1px, transparent 1px)
          `,
          backgroundSize: '45px 45px',
          maskImage: `
            radial-gradient(ellipse 95% 85% at 50% 50%, 
              black 0%, 
              transparent 70%
            )
          `,
          WebkitMaskImage: `
            radial-gradient(ellipse 95% 85% at 50% 50%, 
              black 0%, 
              transparent 70%
            )
          `,
        }}
      />

      {/* Film grain texture overlay - STRONGER */}
      <div 
        className="absolute inset-0 opacity-[0.09] mix-blend-overlay animate-grain"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px',
        }}
      />
    </div>
  );
};

export default CinematicBackground;

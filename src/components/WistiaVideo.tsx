import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Maximize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

const DEFAULT_MEDIA_ID = "ty53stvjwv";

type WistiaPlayerElement = HTMLElement & {
  // Properties
  currentTime: number;
  duration: number;
  muted: boolean;
  paused: boolean;
  playbackRate: number;

  // Methods
  play: () => void;
  pause: () => void;
  requestFullscreen: () => void;
};
interface WistiaVideoProps {
  aspectRatio?: "16:9" | "9:16" | "5:4" | "4:3";
  mediaId?: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
}
const WistiaVideo = ({
  aspectRatio = "5:4",
  mediaId = DEFAULT_MEDIA_ID,
  overlayTitle = "VEJA O FUNCIONAMENTO",
  overlaySubtitle = "TOQUE PARA ASSISTIR"
}: WistiaVideoProps) => {
  const PLAYER_ELEMENT_ID = `wistia-player-${mediaId}`;
  const getAspectConfig = () => {
    switch (aspectRatio) {
      case "16:9":
        return { paddingTop: "56.25%", wistiaAspect: "1.7778" };
      case "9:16":
        return { paddingTop: "177.78%", wistiaAspect: "0.5625" };
      case "4:3":
        return { paddingTop: "76.81%", wistiaAspect: "1.3018518518518518" };
      case "5:4":
      default:
        return { paddingTop: "80%", wistiaAspect: "1.25" };
    }
  };
  const { paddingTop, wistiaAspect } = getAspectConfig();
  const [hasStarted, setHasStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMobile, setIsMobile] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const playerRef = useRef<WistiaPlayerElement | null>(null);
  const shouldAutoplayRef = useRef(false);
  const controlsTimeoutRef = useRef<number | null>(null);
  const speedOptions = [1.0, 1.1, 1.2, 1.5, 2.0];
  const progress = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, Math.max(0, currentTime / duration * 100));
  }, [currentTime, duration]);
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    // Load Wistia player script
    const playerScript = document.createElement("script");
    playerScript.src = "https://fast.wistia.com/player.js";
    playerScript.async = true;
    document.head.appendChild(playerScript);

    // Load Wistia embed script
    const embedScript = document.createElement("script");
    embedScript.src = `https://fast.wistia.com/embed/${mediaId}.js`;
    embedScript.async = true;
    embedScript.type = "module";
    document.head.appendChild(embedScript);
    return () => {
      if (playerScript.parentNode) playerScript.parentNode.removeChild(playerScript);
      if (embedScript.parentNode) embedScript.parentNode.removeChild(embedScript);
    };
  }, [hasStarted]);
  useEffect(() => {
    if (!hasStarted) return;
    let mounted = true;
    let attempts = 0;
    const attach = (player: WistiaPlayerElement) => {
      playerRef.current = player;
      const syncBasics = () => {
        if (!mounted) return;
        setDuration(player.duration || 0);
        setCurrentTime(player.currentTime || 0);
        setIsMuted(!!player.muted);
        setIsPlaying(!player.paused);
      };
      const onApiReady = () => {
        if (!mounted) return;
        setIsReady(true);
        syncBasics();

        // if start came from a user gesture, we can safely try to autoplay
        if (shouldAutoplayRef.current) {
          try {
            player.play();
          } catch {
            // ignore autoplay failures
          }
        }
      };
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnded = () => setIsPlaying(false);
      const onLoadedMetadata = () => {
        if (!mounted) return;
        setDuration(player.duration || 0);
      };
      const onTimeUpdate = () => {
        if (!mounted) return;
        setCurrentTime(player.currentTime || 0);
        setDuration(player.duration || 0);
      };
      const onMuteChange = (event: Event) => {
        if (!mounted) return;
        const e = event as CustomEvent<{
          isMuted: boolean;
        }>;
        setIsMuted(!!(e.detail?.isMuted ?? player.muted));
      };
      player.addEventListener("api-ready", onApiReady);
      player.addEventListener("loaded-metadata", onLoadedMetadata);
      player.addEventListener("time-update", onTimeUpdate);
      player.addEventListener("play", onPlay);
      player.addEventListener("pause", onPause);
      player.addEventListener("ended", onEnded);
      player.addEventListener("mute-change", onMuteChange as EventListener);
      return () => {
        player.removeEventListener("api-ready", onApiReady);
        player.removeEventListener("loaded-metadata", onLoadedMetadata);
        player.removeEventListener("time-update", onTimeUpdate);
        player.removeEventListener("play", onPlay);
        player.removeEventListener("pause", onPause);
        player.removeEventListener("ended", onEnded);
        player.removeEventListener("mute-change", onMuteChange as EventListener);
      };
    };
    let detach: null | (() => void) = null;
    const tryFindAndAttach = () => {
      attempts += 1;
      const el = document.getElementById(PLAYER_ELEMENT_ID) as WistiaPlayerElement | null;
      if (el) {
        detach = attach(el) || null;
        return true;
      }
      return false;
    };

    // Poll for the custom element to exist
    const interval = window.setInterval(() => {
      if (tryFindAndAttach() || attempts > 40) {
        window.clearInterval(interval);
      }
    }, 50);

    // also try immediately
    tryFindAndAttach();
    return () => {
      mounted = false;
      window.clearInterval(interval);
      detach?.();
    };
  }, [hasStarted]);
  const handleStart = () => {
    shouldAutoplayRef.current = true;
    setHasStarted(true);
  };
  const formatTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) ? seconds : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const showControlsForAWhile = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      // Hide controls after timeout (3s on mobile, 2.5s on desktop)
      if (isPlaying) setShowControls(false);
    }, isMobile ? 3000 : 2500);
  };
  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (isPlaying) player.pause();else player.play();
    } catch {
      // ignore
    }
  };
  const handleRestart = () => {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = 0;
    try {
      player.play();
    } catch {
      // ignore
    }
  };
  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  const handleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.requestFullscreen();
    } catch {
      // ignore
    }
  };

  const handleSpeedChange = (speed: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  // Set default speed when player is ready
  useEffect(() => {
    if (isReady && playerRef.current) {
      playerRef.current.playbackRate = 1.0;
    }
  }, [isReady]);

  // Tela inicial antes do vídeo - Card flutuante com transparência
  if (!hasStarted) {
    return (
      <div className="w-full mx-auto">
      <div
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          style={{ 
            paddingTop,
            border: '2px solid transparent',
            borderImage: 'linear-gradient(135deg, hsla(252, 85%, 67%, 0.5), hsla(270, 70%, 60%, 0.3), hsla(252, 85%, 67%, 0.5)) 1',
          }}
          onClick={handleStart}
          aria-label="Toque para ver o vídeo"
          role="button"
          tabIndex={0}
        >
          {/* Thumbnail background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://fast.wistia.com/embed/medias/${mediaId}/swatch')`,
            }}
          />
          {/* Dark overlay on thumbnail */}
          <div className="absolute inset-0 bg-background/70" />

          {/* Floating transparent card in center */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div 
              className="relative rounded-2xl px-8 py-6 sm:px-10 sm:py-8 flex flex-col items-center transition-transform duration-300 group-hover:scale-[1.02]"
              style={{
                background: 'hsla(252, 70%, 55%, 0.12)',
                boxShadow: '0 8px 32px hsla(252, 85%, 40%, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                animation: 'breathe 3s ease-in-out infinite',
              }}
            >
              {/* Play Button */}
              <div className="relative mb-5">
                {/* Outer pulse ring */}
                <div 
                  className="absolute -inset-5 rounded-full border border-white/25"
                  style={{
                    animation: 'pulse-scale 1.5s ease-in-out infinite'
                  }}
                />
                {/* Inner glow ring */}
                <div 
                  className="absolute -inset-2.5 rounded-full bg-white/10"
                  style={{
                    animation: 'pulse-scale 1.5s ease-in-out infinite 0.3s'
                  }}
                />
                <button
                  type="button"
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, #8065f3 0%, #6d4ed8 50%, #9b7bf7 100%)',
                    boxShadow: '0 4px 24px rgba(128, 101, 243, 0.5)',
                    animation: 'breathe 2s ease-in-out infinite'
                  }}
                >
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-0.5" fill="white" />
                </button>
              </div>

              {/* Text */}
              <h3 className="text-white font-bold text-sm sm:text-base tracking-wide uppercase text-center">
                {overlayTitle}
              </h3>
              <p className="text-white/60 text-xs sm:text-sm uppercase tracking-wider mt-1">
                {overlaySubtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Player + Controles personalizados
  return (
    <div className="w-full mx-auto">
      <style>
        {`
          wistia-player[media-id='${mediaId}']:not(:defined) {
            background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${mediaId}/swatch');
            display: block;
            filter: blur(5px);
            padding-top: ${paddingTop};
          }
        `}
      </style>

      <div
        className="relative rounded-2xl overflow-hidden bg-card"
        style={{
          border: 'none',
        }}
        onMouseMove={() => {
          if (!isMobile) showControlsForAWhile();
        }}
        onMouseLeave={() => {
          if (!isMobile && isPlaying) setShowControls(false);
        }}
        onClick={() => {
          if (isMobile) {
            // On mobile, first tap shows controls, second tap toggles play
            if (!showControls) {
              showControlsForAWhile();
            } else {
              togglePlay();
              showControlsForAWhile();
            }
          } else {
            showControlsForAWhile();
            togglePlay();
          }
        }}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <wistia-player
                id="${PLAYER_ELEMENT_ID}"
                media-id="${mediaId}"
                aspect="${wistiaAspect}"
                autoplay="true"
                controls-visible-on-load="false"
                big-play-button="false"
                play-pause-control="false"
                play-bar-control="false"
                volume-control="false"
                fullscreen-control="false"
                settings-control="false"
              ></wistia-player>
            `,
          }}
        />

        {/* Overlay Play - minimalista */}
        {!isPlaying && isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40" aria-hidden>
            <div 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center"
              style={{ boxShadow: '0 4px 20px hsl(252 85% 67% / 0.5)' }}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* Controls Bar - Dark gradient */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 pt-8">
            {/* Progress bar - visual only, not clickable */}
            <div className="w-full h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              {/* Left: Play + Time */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { showControlsForAWhile(); togglePlay(); }}
                  className={`w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors ${!isReady ? "opacity-50" : ""}`}
                  aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                  )}
                </button>
                
                <span className="text-white/80 text-xs font-medium tabular-nums">
                  {formatTime(currentTime)}
                </span>
              </div>

              {/* Right: Speed + Volume + Fullscreen */}
              <div className="flex items-center gap-2 relative">
                {/* Speed control */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { showControlsForAWhile(); setShowSpeedMenu(!showSpeedMenu); }}
                    className={`h-7 px-2 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-white text-xs font-medium ${!isReady ? "opacity-50" : ""}`}
                    aria-label="Velocidade"
                  >
                    {playbackRate}x
                  </button>
                  
                  {/* Speed menu */}
                  {showSpeedMenu && (
                    <div 
                      className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {speedOptions.map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => handleSpeedChange(speed)}
                          className={`w-full px-4 py-2 text-xs font-medium text-left transition-colors hover:bg-white/10 ${
                            playbackRate === speed ? 'text-primary bg-white/5' : 'text-white/80'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { showControlsForAWhile(); toggleMute(); }}
                  className={`w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors ${!isReady ? "opacity-50" : ""}`}
                  aria-label={isMuted ? "Ativar som" : "Silenciar"}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { showControlsForAWhile(); handleFullscreen(); }}
                  className={`w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors ${!isReady ? "opacity-50" : ""}`}
                  aria-label="Tela cheia"
                >
                  <Maximize className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WistiaVideo;

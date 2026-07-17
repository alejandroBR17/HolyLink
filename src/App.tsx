import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Armchair, MessageSquareOff, Globe, Flame, DoorOpen, Smartphone, Clock, Tv, Instagram, HeartHandshake, QrCode, Settings, Bell, X, CalendarDays, WifiOff, Maximize, Minimize, ExternalLink, Play, Pause, Plus, Minus, RefreshCw, AlertTriangle, Monitor, Laptop, Send, Trash2, EyeOff, Sparkles, Shuffle, BookOpen, Undo2, Search, Image, Film } from 'lucide-react';
import QRCode from "react-qr-code";
import { WEEK_SCHEDULES, VERSES, SOCIAL, DONATION, CAMPAIGNS, CHURCH_INFO, ALERTS } from './data';
import { getNextMeeting, getAllMediaItems, saveMediaItem, deleteMediaItem } from './utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ==========================================
// 1. DATA CONSTANTS
// ==========================================

type SlideType = string;

interface CustomMedia {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number; // in milliseconds
  enabledInLoop: boolean;
  url: string;
}

const getSlideDuration = (slideId: string, customMedia: CustomMedia[] = []): number => {
  if (slideId.startsWith('custom_')) {
    const item = customMedia.find(m => m.id === slideId);
    return item ? item.duration : 10000;
  }
  if (slideId.startsWith('agenda_day_')) return 12000;
  if (slideId.startsWith('verse_')) return 15000;
  if (slideId === 'world_god') return 15000;
  if (slideId === 'soon') return 7000;
  if (['seat', 'bathroom', 'phone', 'no_chat'].includes(slideId)) return 8000;
  if (['social', 'campaigns'].includes(slideId)) return 12000;
  if (slideId === 'donations') return 20000;
  return 10000;
};

// ==========================================
// PARTICLES BACKGROUND
// ==========================================
const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = 1920;
    let height = canvas.height = 1080;

    const particles: any[] = [];
    const colors = ['#dc2626', '#b91c1c', '#f59e0b', '#fbbf24']; // reds and yellows
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 0.1, // slight upward drift
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: Math.random() * 0.02 + 0.005,
        angle: Math.random() * Math.PI * 2
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.pulseSpeed;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const currentAlpha = p.alpha + Math.sin(p.angle) * 0.2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen"
    />
  );
};

// ==========================================
// 2. SLIDE COMPONENTS
// ==========================================

const IconSlide = ({ icon: Icon, title, subtitle, pulse = false, layout = 'center' }: any) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  if (layout === 'split-left') {
    return (
      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="flex items-center justify-between w-full max-w-[95%] px-12"
      >
        <div className="flex-1 text-left pr-20">
          <motion.h1 variants={item} className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">
            {title}
          </motion.h1>
          <motion.p variants={item} className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%]">
            {subtitle}
          </motion.p>
        </div>
        <motion.div 
          variants={item} 
          className="flex-shrink-0"
        >
          <Icon className={`w-[450px] h-[450px] text-yellow-500 opacity-80 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1} />
        </motion.div>
      </motion.div>
    );
  }

  if (layout === 'split-right') {
    return (
      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="flex items-center justify-between w-full max-w-[95%] px-12"
      >
        <motion.div 
          variants={item} 
          className="flex-shrink-0"
        >
          <Icon className={`w-[450px] h-[450px] text-yellow-500 opacity-80 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1} />
        </motion.div>
        <div className="flex-1 text-right pl-20">
          <motion.h1 variants={item} className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">
            {title}
          </motion.h1>
          <motion.p variants={item} className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%] ml-auto">
            {subtitle}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="flex flex-col items-center justify-center text-center max-w-[85%]"
    >
      <motion.div 
        variants={item}
      >
        <Icon className={`w-56 h-56 text-yellow-500 mb-12 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
      </motion.div>
      <motion.h1 variants={item} className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">
        {title}
      </motion.h1>
      <motion.p variants={item} className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%]">
        {subtitle}
      </motion.p>
    </motion.div>
  );
};

const WorldGodSlide = () => {
  const [phase, setPhase] = useState<'world' | 'god'>('world');
  
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('god');
    }, 7500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center max-w-5xl h-full w-full">
      <AnimatePresence mode="wait">
        {phase === 'world' ? (
          <motion.div 
            key="world"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <Globe className="w-64 h-64 text-stone-500 mb-14 animate-[spin_20s_linear_infinite]" strokeWidth={1} />
            <h1 className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none uppercase">
              Desligue-se do mundo
            </h1>
          </motion.div>
        ) : (
          <motion.div 
            key="god"
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <motion.div>
              <Flame className="w-64 h-64 text-yellow-500 mb-14" strokeWidth={1.5} />
            </motion.div>
            <h1 className="font-sans font-black text-[7.5rem] tracking-tight text-yellow-500 leading-none uppercase drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              Ligue-se com Deus
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AgendaDaySlide = ({ dayIndex, currentTime }: { dayIndex: number; currentTime: Date }) => {
  const schedule = WEEK_SCHEDULES.find(s => s.dayIndex === dayIndex) || WEEK_SCHEDULES[0];
  const isToday = currentTime.getDay() === dayIndex;
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };
  
  const item = {
    hidden: { opacity: 0, x: -40 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 60 } }
  };

  const itemRight = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 60 } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="flex items-center justify-between max-w-[95%] w-full px-10"
    >
      <div className="flex-1 text-left pr-16 border-r border-white/[0.1]">
        <motion.span variants={item} className="text-yellow-500 font-bold uppercase tracking-[0.4em] mb-6 text-3xl block">
          {isToday ? 'Reuniões de Hoje' : 'Agenda Semanal'}
        </motion.span>
        <motion.h3 variants={item} className="text-stone-200 font-bold uppercase tracking-[0.3em] mb-6 text-[2.5rem]">
          {schedule.dayName}
        </motion.h3>
        <motion.h2 variants={item} className="text-[7.5rem] text-white font-black uppercase tracking-tight leading-none mt-4">
          {schedule.theme}
        </motion.h2>
      </div>
      <div className="flex-1 pl-16">
        <motion.div variants={itemRight} className="grid grid-cols-2 gap-6">
          {schedule.times.map((t, i) => (
            <motion.div 
              key={t} 
              className="bg-white/[0.03] border border-white/[0.08] px-12 py-10 rounded-3xl shadow-xl flex items-center justify-center relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <span className="font-mono text-[4.5rem] font-black tracking-wider relative z-10 text-white">{t}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

const VerseSlide = ({ 
  currentTime, 
  verseIndexOffset = 0, 
  loopIteration,
  customVerseText,
  customVerseRef,
  activeVerseIndex,
}: { 
  currentTime: Date; 
  verseIndexOffset?: number; 
  loopIteration?: number; 
  customVerseText?: string | null;
  customVerseRef?: string | null;
  activeVerseIndex?: number | null;
}) => {
  let verse = { text: "", ref: "" };
  let keyId = "verse";

  if (customVerseText) {
    verse = { text: customVerseText, ref: customVerseRef || "Mensagem" };
    keyId = "custom";
  } else if (activeVerseIndex !== null && activeVerseIndex !== undefined) {
    const safeIdx = Math.max(0, Math.min(activeVerseIndex, VERSES.length - 1));
    verse = VERSES[safeIdx];
    keyId = `idx_${safeIdx}`;
  } else {
    let verseIdx = 0;
    if (loopIteration !== undefined) {
      verseIdx = (loopIteration + verseIndexOffset) % VERSES.length;
    } else {
      const baseVerseIdx = Math.floor(currentTime.getTime() / 15000);
      verseIdx = (baseVerseIdx + verseIndexOffset) % VERSES.length;
    }
    verse = VERSES[verseIdx];
    keyId = `auto_${verseIdx}`;
  }

  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len < 60) return 'text-[5.5rem]';
    if (len < 90) return 'text-[4.5rem]';
    if (len < 130) return 'text-[3.8rem]';
    return 'text-[3.2rem]';
  };

  const getMarginClass = (text: string) => {
    const len = text.length;
    if (len < 90) return 'mt-12';
    return 'mt-8';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-24 text-center z-50 relative">
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-600/5 blur-[150px] rounded-full pointer-events-none" />
       <AnimatePresence mode="wait">
         <motion.div
           key={keyId}
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 1.02 }}
           transition={{ duration: 1.5, ease: "easeInOut" }}
           className="relative z-10 w-full"
         >
           <h2 className={`${getFontSizeClass(verse.text)} text-stone-100 leading-snug font-semibold tracking-tight max-w-[95%] mx-auto`}>
             "{verse.text}"
           </h2>
           <p className={`text-yellow-500 text-[2.5rem] font-bold ${getMarginClass(verse.text)} tracking-[0.2em] uppercase`}>
             {verse.ref}
           </p>
         </motion.div>
       </AnimatePresence>
    </div>
  );
};

// ==========================================
// 3. MAIN APP
const DonationSlide = () => {
  return (
    <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="flex items-center justify-between w-full max-w-[95%] px-20"
    >
      <div className="flex-1 text-left pr-20">
        <motion.div className="flex items-center gap-4 mb-6">
          <HeartHandshake className="w-24 h-24 text-yellow-500" strokeWidth={1.5} />
          <span className="text-yellow-500 font-bold uppercase tracking-[0.4em] text-3xl">Dízimos e Ofertas</span>
        </motion.div>
        <h1 className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">
          Faça sua <br />Doação
        </h1>
        <p className="text-[3.5rem] text-stone-200 font-normal mt-6 leading-snug max-w-[90%] mb-12">
          Acesse <span className="text-yellow-500 font-bold">{DONATION.url.replace(/^https?:\/\//, '')}</span> ou escaneie o QR Code ao lado.
        </p>
        <div className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-2xl inline-block">
           <p className="text-stone-300 text-3xl font-medium">Lembre-se de enviar o comprovante</p>
           <p className="text-stone-400 text-2xl mt-2">O WhatsApp está disponível no site.</p>
        </div>
      </div>
      <motion.div className="flex-shrink-0 bg-white p-6 rounded-3xl">
        <QRCode value={DONATION.url} size={480} />
      </motion.div>
    </motion.div>
  );
};

const CampaignSlide = () => {
  return (
    <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="flex flex-col items-center justify-center text-center max-w-[95%] w-full"
    >
      <CalendarDays className="w-16 h-16 text-stone-500 mb-4" strokeWidth={1.5} />
      <h1 className="font-sans font-semibold text-4xl tracking-wide text-stone-400 uppercase mb-16">
        Propósitos Atuais
      </h1>
      <div className="grid grid-cols-2 gap-10 w-full">
        {CAMPAIGNS.map((campaign, index) => {
          const Icon = campaign.type === 'jejum_daniel' ? WifiOff : Flame;
          return (
            <div key={index} className="bg-white/[0.03] border border-white/[0.08] p-16 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <Icon className="w-48 h-48 text-yellow-500 mb-12" strokeWidth={1} />
               <h3 className="text-white font-black text-[6rem] mb-8 tracking-tight leading-none drop-shadow-[0_0_30px_rgba(234,179,8,0.3)] whitespace-pre-line">{campaign.title}</h3>
               <p className="text-yellow-500 text-4xl uppercase tracking-[0.2em] font-bold mt-6">{campaign.duration}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
// ==========================================

const VideoSlide = ({ media, currentSlideId }: { media: CustomMedia; currentSlideId: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (currentSlideId === media.id) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.log("Autoplay unmuted blocked, playing muted", e);
          video.muted = true;
          video.play().catch((err) => console.error("Could not play video even muted", err));
        });
      }
    } else {
      video.pause();
    }
  }, [currentSlideId, media.id]);

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-black">
      <video
        ref={videoRef}
        src={media.url}
        className="max-w-full max-h-full object-contain"
        playsInline
        controls={false}
      />
    </div>
  );
};

export default function App() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [manualRotateMode, setManualRotateMode] = useState<'auto' | 'force-landscape'>('auto');

  // Synchronized Presentation States
  const [isLocalProjection, setIsLocalProjection] = useState(false);
  const isProjectionView = (typeof window !== 'undefined' && window.location.search.includes('projection')) || isLocalProjection;

  const [manualSlideOverride, setManualSlideOverride] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_manualSlideOverride');
  });
  const [countdownOffset, setCountdownOffset] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem('projection_countdownOffset') || '0', 10);
  });
  const [countdownPaused, setCountdownPaused] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_countdownPaused') === 'true';
  });
  const [pausedSeconds, setPausedSeconds] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem('projection_pausedSeconds');
    return val ? parseInt(val, 10) : null;
  });
  const [activeAlert, setActiveAlert] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_activeAlert');
  });
  const [blackoutEnabled, setBlackoutEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_blackoutEnabled') === 'true';
  });
  const [clearContentEnabled, setClearContentEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_clearContentEnabled') === 'true';
  });
  const [activeVerseIndex, setActiveVerseIndex] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem('projection_activeVerseIndex');
    return val ? parseInt(val, 10) : null;
  });
  const [customVerseText, setCustomVerseText] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_customVerseText');
  });
  const [customVerseRef, setCustomVerseRef] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_customVerseRef');
  });
  const [dismissedJustStarted, setDismissedJustStarted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_dismissedJustStarted') === 'true';
  });

  // Custom Media States
  const [mediaUpdateTrigger, setMediaUpdateTrigger] = useState<string>(() => {
    if (typeof window === 'undefined') return '0';
    return localStorage.getItem('projection_mediaUpdateTrigger') || '0';
  });
  const [customMediaList, setCustomMediaList] = useState<CustomMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load custom media files from DB on trigger or mount
  useEffect(() => {
    let active = true;
    const loadMedia = async () => {
      try {
        const items = await getAllMediaItems();
        if (!active) return;
        
        // Revoke old object URLs to avoid memory leaks
        setCustomMediaList((prevList) => {
          prevList.forEach((m) => {
            if (m.url && m.url.startsWith('blob:')) {
              URL.revokeObjectURL(m.url);
            }
          });
          
          return items.map((item) => ({
            id: item.id,
            type: item.type,
            name: item.name,
            duration: item.duration,
            enabledInLoop: item.enabledInLoop,
            url: URL.createObjectURL(item.blob)
          }));
        });
      } catch (err) {
        console.error("Failed to load custom media from DB", err);
      }
    };

    loadMedia();

    return () => {
      active = false;
    };
  }, [mediaUpdateTrigger]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setUploadError("Por favor, selecione apenas arquivos de imagem ou vídeo.");
      setIsUploading(false);
      return;
    }

    try {
      let duration = 10000; // default 10 seconds for images

      if (isVideo) {
        // Measure exact duration of video
        duration = await new Promise<number>((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          const objectUrl = URL.createObjectURL(file);
          video.src = objectUrl;
          video.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(Math.round(video.duration * 1000));
          };
          video.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(10000); // fallback if metadata fails
          };
        });
      }

      const id = `custom_${isVideo ? 'vid' : 'img'}_${Date.now()}`;
      await saveMediaItem({
        id,
        type: isVideo ? 'video' : 'image',
        name: file.name,
        duration,
        enabledInLoop: true,
        blob: file
      });

      // Broadcast update
      updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
    } catch (err: any) {
      console.error("Error saving uploaded file:", err);
      setUploadError("Não foi possível salvar o arquivo. Limite de armazenamento pode ter sido excedido.");
    } finally {
      setIsUploading(false);
      // Reset input value to allow uploading same file again
      e.target.value = '';
    }
  };

  const updateStateAndBroadcast = (key: string, value: any) => {
    if (value === null || value === undefined) {
      localStorage.removeItem(`projection_${key}`);
    } else {
      localStorage.setItem(`projection_${key}`, value.toString());
    }

    if (key === 'manualSlideOverride') setManualSlideOverride(value);
    else if (key === 'countdownOffset') setCountdownOffset(value);
    else if (key === 'countdownPaused') setCountdownPaused(value);
    else if (key === 'pausedSeconds') setPausedSeconds(value);
    else if (key === 'activeAlert') setActiveAlert(value);
    else if (key === 'blackoutEnabled') setBlackoutEnabled(value === 'true' || value === true);
    else if (key === 'clearContentEnabled') setClearContentEnabled(value === 'true' || value === true);
    else if (key === 'activeVerseIndex') setActiveVerseIndex(value !== null ? parseInt(value, 10) : null);
    else if (key === 'customVerseText') setCustomVerseText(value);
    else if (key === 'customVerseRef') setCustomVerseRef(value);
    else if (key === 'dismissedJustStarted') setDismissedJustStarted(value === 'true' || value === true);
    else if (key === 'mediaUpdateTrigger') setMediaUpdateTrigger(value);

    try {
      const bc = new BroadcastChannel('holyrics_projection_sync');
      bc.postMessage({ type: 'UPDATE_STATE', key, value });
      bc.close();
    } catch (e) {
      // Fallback to storage event when BroadcastChannel fails
    }
  };

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('holyrics_projection_sync');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'UPDATE_STATE') {
          const { key, value } = event.data;
          if (key === 'manualSlideOverride') setManualSlideOverride(value);
          else if (key === 'countdownOffset') setCountdownOffset(value);
          else if (key === 'countdownPaused') setCountdownPaused(value);
          else if (key === 'pausedSeconds') setPausedSeconds(value);
          else if (key === 'activeAlert') setActiveAlert(value);
          else if (key === 'blackoutEnabled') setBlackoutEnabled(value === 'true' || value === true);
          else if (key === 'clearContentEnabled') setClearContentEnabled(value === 'true' || value === true);
          else if (key === 'activeVerseIndex') setActiveVerseIndex(value !== null ? parseInt(value, 10) : null);
          else if (key === 'customVerseText') setCustomVerseText(value);
          else if (key === 'customVerseRef') setCustomVerseRef(value);
          else if (key === 'dismissedJustStarted') setDismissedJustStarted(value === 'true' || value === true);
          else if (key === 'mediaUpdateTrigger') setMediaUpdateTrigger(value);
        }
      };
    } catch (e) {
      console.warn("BroadcastChannel not supported in this frame environment. Using localStorage fallback.");
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('projection_')) {
        const key = e.key.replace('projection_', '');
        const val = e.newValue;
        if (key === 'manualSlideOverride') setManualSlideOverride(val);
        else if (key === 'countdownOffset') setCountdownOffset(val ? parseInt(val, 10) : 0);
        else if (key === 'countdownPaused') setCountdownPaused(val === 'true');
        else if (key === 'pausedSeconds') setPausedSeconds(val ? parseInt(val, 10) : null);
        else if (key === 'activeAlert') setActiveAlert(val);
        else if (key === 'blackoutEnabled') setBlackoutEnabled(val === 'true');
        else if (key === 'clearContentEnabled') setClearContentEnabled(val === 'true');
        else if (key === 'activeVerseIndex') setActiveVerseIndex(val ? parseInt(val, 10) : null);
        else if (key === 'customVerseText') setCustomVerseText(val);
        else if (key === 'customVerseRef') setCustomVerseRef(val);
        else if (key === 'dismissedJustStarted') setDismissedJustStarted(val === 'true');
        else if (key === 'mediaUpdateTrigger') setMediaUpdateTrigger(val || '0');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  // Screen resizing
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Responsive Operator's Panel states
  const [activeMobileTab, setActiveMobileTab] = useState<'slides' | 'controls' | 'monitor'>('slides');
  const monitorContainerRef = useRef<HTMLDivElement>(null);
  const [monitorScale, setMonitorScale] = useState(0.13);

  useEffect(() => {
    const updateScale = () => {
      if (monitorContainerRef.current) {
        const w = monitorContainerRef.current.clientWidth;
        setMonitorScale(w / 1920);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    const timer = setTimeout(updateScale, 200);
    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(timer);
    };
  }, [activeMobileTab]);

  // Local Bible API states
  const [bibleTab, setBibleTab] = useState<'favorites' | 'api'>('favorites');
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [apiSearchResult, setApiSearchResult] = useState<{ text: string; ref: string } | null>(null);
  const [apiSearchLoading, setApiSearchLoading] = useState(false);
  const [apiSearchError, setApiSearchError] = useState<string | null>(null);

  const parseAndMapReference = (rawRef: string) => {
    const normalized = rawRef.trim().toLowerCase();
    const regex = /^(\d+)?\s*([a-záéíóúçâêôûãõ\s]+)\s+(\d+)(?:[:\.](\d+))?(-(\d+))?$/i;
    const match = normalized.match(regex);
    if (!match) return rawRef;

    const bookNumber = match[1] ? match[1].trim() + " " : "";
    const rawBookName = match[2].trim();
    const chapter = match[3];
    const startVerse = match[4] || "";
    const endVerse = match[6] ? "-" + match[6] : "";

    const bookMap: Record<string, string> = {
      "gênesis": "genesis", "genesis": "genesis", "gn": "genesis",
      "êxodo": "exodus", "exodo": "exodus", "ex": "exodus",
      "levítico": "leviticus", "levitico": "leviticus", "lv": "leviticus",
      "números": "numbers", "numeros": "numbers", "nm": "numbers",
      "deuteronômio": "deuteronomy", "deuteronomio": "deuteronomy", "dt": "deuteronomy",
      "josué": "joshua", "josue": "joshua", "js": "joshua",
      "juízes": "judges", "juizes": "judges", "jz": "judges",
      "rute": "ruth", "rt": "ruth",
      "samuel": "samuel", "sm": "samuel",
      "reis": "kings", "re": "kings",
      "crônicas": "chronicles", "cronicas": "chronicles", "cr": "chronicles",
      "esdras": "ezra", "es": "ezra",
      "neemias": "neemiah", "ne": "neemiah",
      "ester": "esther", "et": "esther",
      "jó": "job",
      "salmos": "psalms", "salmo": "psalms", "sl": "psalms",
      "provérbios": "proverbs", "proverbios": "proverbs", "pv": "proverbs",
      "eclesiastes": "ecclesiastes", "ec": "ecclesiastes",
      "cantares": "song of solomon", "cântico dos cânticos": "song of solomon", "cantico dos canticos": "song of solomon", "ct": "song of solomon",
      "isaías": "isaiah", "isaias": "isaiah", "is": "isaiah",
      "jeremias": "jeremiah", "jr": "jeremiah",
      "lamentações": "lamentations", "lamentacoes": "lamentations", "lm": "lamentations",
      "ezequiel": "ezekiel", "ez": "ezekiel",
      "daniel": "daniel", "dn": "daniel",
      "oséias": "hosea", "oseias": "hosea", "os": "hosea",
      "joel": "joel", "jl": "joel",
      "amós": "amos", "amos": "amos", "am": "amos",
      "obadias": "obadiah", "ob": "obadiah",
      "jonas": "jonah", "jn": "jonah",
      "miquéias": "micah", "miqueias": "micah", "mq": "micah",
      "naum": "nahum", "na": "nahum",
      "habacuque": "habakkuk", "hc": "habakkuk",
      "sofonias": "zephaniah", "sf": "zephaniah",
      "ageu": "haggai", "ag": "haggai",
      "zacarias": "zechariah", "zc": "zechariah",
      "malaquias": "malachi", "ml": "malachi",
      "mateus": "matthew", "mt": "matthew",
      "marcos": "mark", "mc": "mark",
      "lucas": "luke", "lc": "luke",
      "joão": "john", "joao": "john", "jo": "john",
      "atos": "acts", "at": "acts",
      "romanos": "romans", "rm": "romans",
      "coríntios": "corinthians", "corintios": "corinthians", "co": "corinthians",
      "gálatas": "galatians", "galatas": "galatians", "gl": "galatians",
      "efésios": "ephesians", "efesios": "ephesians", "ef": "ephesians",
      "filipenses": "philippians", "fp": "philippians",
      "colossenses": "colossians", "cl": "colossians",
      "tessalonicenses": "thessalonians", "ts": "thessalonians",
      "timóteo": "timothy", "timoteo": "timothy", "tm": "timothy",
      "tito": "titus", "tt": "titus",
      "filemom": "philemon", "fl": "philemon",
      "hebreus": "hebrew", "hb": "hebrew",
      "tiago": "james", "tg": "james",
      "pedro": "peter", "pe": "peter",
      "judas": "judas", "jd": "judas",
      "apocalipse": "revelation", "ap": "revelation"
    };

    const englishBook = bookMap[rawBookName] || rawBookName;
    let finalRef = `${bookNumber}${englishBook} ${chapter}`;
    if (startVerse) {
      finalRef += `:${startVerse}${endVerse}`;
    }
    return finalRef;
  };

  const handleBibleSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setApiSearchLoading(true);
    setApiSearchError(null);
    setApiSearchResult(null);

    try {
      const parsedRef = parseAndMapReference(queryStr);
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(parsedRef)}?translation=almeida`);
      if (!response.ok) {
        throw new Error('Versículo não encontrado. Verifique a grafia e tente novamente (ex: João 3:16 ou Sl 23:1).');
      }
      
      const data = await response.json();
      if (!data.text || data.text.trim() === '') {
        throw new Error('Não foi possível obter o texto do versículo.');
      }

      const formattedQuery = queryStr.trim().replace(/^\w/, (c) => c.toUpperCase());
      
      setApiSearchResult({
        text: data.text.trim(),
        ref: formattedQuery
      });
    } catch (err: any) {
      console.error('Error fetching verse:', err);
      setApiSearchError(err.message || 'Erro ao buscar o versículo na Bíblia Online.');
    } finally {
      setApiSearchLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          console.error("Erro ao ativar tela cheia:", err);
        });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch((err) => {
            console.error("Erro ao sair de tela cheia:", err);
          });
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Keyboard listener for fullscreen toggle and exiting local projection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'Escape') {
        setIsLocalProjection(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Meeting State
  const { nextMeeting, nextMeetingDate, ongoingMeeting } = getNextMeeting(currentTime);
  
  let isJustStartedRaw = false;
  if (ongoingMeeting) {
    const mStart = new Date(currentTime);
    mStart.setHours(ongoingMeeting.hours, ongoingMeeting.minutes, 0, 0);
    const elapsedSinceStart = currentTime.getTime() - mStart.getTime();
    if (elapsedSinceStart >= 0 && elapsedSinceStart <= 30 * 60 * 1000) {
      isJustStartedRaw = true;
    }
  }

  const adjustedNextMeetingDate = new Date(nextMeetingDate.getTime() + countdownOffset);
  const diffMs = adjustedNextMeetingDate.getTime() - currentTime.getTime();

  // Se o cronômetro terminou (chegou a zero ou passou),
  // força a exibição dos versículos bíblicos (reunião iniciada) para evitar telas pretas ou vazias.
  if (!isJustStartedRaw && diffMs <= 0) {
    isJustStartedRaw = true;
  }

  const isJustStarted = isJustStartedRaw && !dismissedJustStarted;

  let diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  
  if (countdownPaused && pausedSeconds !== null) {
    diffSeconds = pausedSeconds;
  }

  const formatMinutesPart = Math.floor(diffSeconds / 60).toString().padStart(2, '0');
  const formatSecondsPart = (diffSeconds % 60).toString().padStart(2, '0');

  const isFinalMinute = !isJustStarted && diffSeconds <= 60 && diffSeconds > 0;
  const isFinalFiveMinutes = !isJustStarted && diffSeconds <= 300 && diffSeconds > 60;
  const isLooping = !isJustStarted && diffSeconds > 300;

  // Auto-reset dismissedJustStarted when countdown is active (meaning far before a meeting)
  useEffect(() => {
    if (diffSeconds > 300 && dismissedJustStarted) {
      updateStateAndBroadcast('dismissedJustStarted', false);
    }
  }, [diffSeconds, dismissedJustStarted]);

  // Render Slide Machine
  const activeSlides: SlideType[] = [
    'agenda_day_0',
    'seat',
    'verse_1',
    'campaigns',
    'agenda_day_1',
    'bathroom',
    'agenda_day_2',
    'verse_2',
    'donations',
    'agenda_day_3',
    'phone',
    'agenda_day_4',
    'social',
    'verse_3',
    'agenda_day_5',
    'no_chat',
    'agenda_day_6',
    'world_god'
  ];

  // Append enabled custom media to the active slides loop
  customMediaList.forEach((media) => {
    if (media.enabledInLoop) {
      activeSlides.push(media.id);
    }
  });

  if (diffSeconds <= 15 * 60) {
    activeSlides.push('soon');
  }

  const totalDuration = activeSlides.reduce((sum, id) => sum + getSlideDuration(id, customMediaList), 0);
  const timeInLoop = currentTime.getTime() % totalDuration;
  const loopIteration = Math.floor(currentTime.getTime() / totalDuration);
  let accumulatedTime = 0;
  let currentSlideId = activeSlides[0];

  if (manualSlideOverride) {
    currentSlideId = manualSlideOverride;
  } else {
    for (const id of activeSlides) {
      const duration = getSlideDuration(id, customMediaList);
      if (timeInLoop >= accumulatedTime && timeInLoop < accumulatedTime + duration) {
        currentSlideId = id;
        break;
      }
      accumulatedTime += duration;
    }
  }

  // Scale calculations for 16:9
  const { width, height } = dimensions;
  const shouldRotate = manualRotateMode === 'auto' && height > width;
  
  let scale = 1;
  if (shouldRotate) {
    const vWidth = height;
    const vHeight = width;
    scale = Math.min(vWidth / 1920, vHeight / 1080);
  } else {
    scale = Math.min(width / 1920, height / 1080);
  }

  // Header Counters
  const countHours = Math.floor(diffSeconds / 3600);
  const countMinutes = Math.floor((diffSeconds % 3600) / 60);
  const hoursStr = countHours.toString().padStart(2, '0');
  const minutesStr = countMinutes.toString().padStart(2, '0');

  // Animation Variants based on slide type
  const getTransitionVariants = (slideId: SlideType) => {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.8, ease: "easeInOut" }
    };
  };

  // Renders the specific slide component
  const renderSlide = (slideId: SlideType) => {
    if (slideId.startsWith("custom_")) {
      const media = customMediaList.find(m => m.id === slideId);
      if (!media) return <div className="text-stone-500 text-3xl font-bold flex items-center justify-center h-full w-full bg-black">Mídia não encontrada</div>;
      if (media.type === 'image') {
        return (
          <div className="w-full h-full flex items-center justify-center relative p-6 bg-black">
            <img 
              src={media.url} 
              alt={media.name} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        );
      } else if (media.type === 'video') {
        return (
          <VideoSlide media={media} currentSlideId={currentSlideId} />
        );
      }
    }
    if (slideId.startsWith("agenda_day_")) {
      const dayIndex = parseInt(slideId.replace("agenda_day_", ""), 10);
      return <AgendaDaySlide dayIndex={dayIndex} currentTime={currentTime} />;
    }
    if (slideId.startsWith("verse_")) {
      const verseIndexOffset = parseInt(slideId.replace("verse_", ""), 10) || 0;
      return (
        <VerseSlide 
          currentTime={currentTime} 
          verseIndexOffset={verseIndexOffset} 
          loopIteration={loopIteration} 
          customVerseText={customVerseText}
          customVerseRef={customVerseRef}
          activeVerseIndex={activeVerseIndex}
        />
      );
    }

    switch (slideId) {
      case 'seat':
        return <IconSlide icon={Armchair} title="Fique à vontade" subtitle="Procure um assento e acomode-se para o início da reunião." layout="split-left" />;
      case 'bathroom':
        return <IconSlide icon={DoorOpen} title="Vá ao banheiro" subtitle="Aproveite para ir antes da reunião começar." layout="split-right" />;
      case 'phone':
        return <IconSlide icon={Smartphone} title="Celular no Silencioso" subtitle="Mantenha o celular no silencioso para evitar interrupções." layout="center" />;
      case 'no_chat':
        return <IconSlide icon={MessageSquareOff} title="Silêncio" subtitle="Desligue-se das conversas e concentre-se na reunião." layout="split-left" />;
      case 'soon':
        return <IconSlide icon={Clock} title="A reunião começa" subtitle="em instantes..." pulse layout="center" />;
      case 'social':
        return <IconSlide icon={Instagram} title="Siga nosso Instagram" subtitle={SOCIAL.instagram} layout="split-left" />;
      case 'donations':
        return <DonationSlide />;
      case 'campaigns':
        return <CampaignSlide />;
      case 'world_god':
        return <WorldGodSlide />;
    }
  };

  if (!isProjectionView) {
    return (
      <div className="w-screen h-screen bg-[#0c0c0c] text-stone-200 flex flex-col font-sans select-none overflow-hidden">
        {/* TOP BAR */}
        <header className="h-auto lg:h-16 px-4 lg:px-6 py-3.5 lg:py-0 bg-[#121212] border-b border-stone-850 flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 z-10 shrink-0">
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-yellow-500" />
              <h1 className="text-white font-bold tracking-tight text-base">
                HolyLink <span className="text-stone-400 text-xs font-medium ml-1.5 sm:ml-2 border-l border-stone-800 pl-1.5 sm:pl-2">Painel do Operador</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-stone-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-stone-400 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Sincronizado
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => {
                setIsLocalProjection(true);
                toggleFullscreen();
              }}
              className="flex-1 lg:flex-none bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Projetar Aqui</span>
            </button>

            <button
              onClick={() => {
                const url = window.location.origin + window.location.pathname + '?projection';
                window.open(url, 'projection_window', 'width=1280,height=720,menubar=no,status=no,titlebar=no');
              }}
              className="flex-1 lg:flex-none bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(234,179,8,0.2)] transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Projeção (2ª Tela)</span>
            </button>
          </div>
        </header>

        {/* CULTO INICIADO BANNER */}
        {isJustStartedRaw && (
          <div className={`px-4 py-3 border-b flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 transition-all z-10 ${
            dismissedJustStarted 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
          }`}>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
              {dismissedJustStarted ? (
                <>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span><strong>Carrossel de Slides Liberado:</strong> Os anúncios, PIX e mídias estão rodando de forma automática e manual na projeção.</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 animate-pulse shrink-0" />
                  <span><strong>Modo Culto Iniciado Ativo:</strong> A TV de projeção está exibindo os Versículos Bíblicos. O carrossel automático está em pausa.</span>
                </>
              )}
            </div>
            
            <button
              onClick={() => updateStateAndBroadcast('dismissedJustStarted', !dismissedJustStarted)}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-md shrink-0 w-full md:w-auto text-center ${
                dismissedJustStarted 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/10" 
                  : "bg-yellow-500 hover:bg-yellow-600 text-black shadow-yellow-500/10"
              }`}
            >
              {dismissedJustStarted ? "Mostrar Versículos na TV" : "Liberar Carrossel de Slides"}
            </button>
          </div>
        )}

        {/* MOBILE TABS BAR (Only visible on screens smaller than lg) */}
        <div className="lg:hidden flex bg-[#121212] border-b border-stone-850 sticky top-0 z-20 shrink-0">
          <button
            onClick={() => setActiveMobileTab('slides')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all ${
              activeMobileTab === 'slides'
                ? "text-yellow-500 border-b-2 border-yellow-500 bg-stone-900/40"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Slides ({activeSlides.length})</span>
          </button>
          <button
            onClick={() => setActiveMobileTab('controls')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all ${
              activeMobileTab === 'controls'
                ? "text-yellow-500 border-b-2 border-yellow-500 bg-stone-900/40"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Controles</span>
          </button>
          <button
            onClick={() => setActiveMobileTab('monitor')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all ${
              activeMobileTab === 'monitor'
                ? "text-yellow-500 border-b-2 border-yellow-500 bg-stone-900/40"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Monitor</span>
          </button>
        </div>

        {/* CONTAINER */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* LEFT: SLIDES MATRIX */}
          <div className={`w-full lg:w-[45%] border-b lg:border-b-0 lg:border-r border-stone-800 bg-[#0d0d0d] p-4 lg:p-6 overflow-y-auto flex flex-col ${activeMobileTab === 'slides' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider">Playlists / Slides</h2>
              {manualSlideOverride ? (
                <button
                  onClick={() => updateStateAndBroadcast('manualSlideOverride', null)}
                  className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-yellow-500/20 transition-all font-bold cursor-pointer animate-pulse"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Voltar ao Automático
                </button>
              ) : (
                <span className="bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Modo Automático Ativo
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:gap-3 pb-8">
              {activeSlides.map((slideId) => {
                const isActive = currentSlideId === slideId;
                const isOverridden = manualSlideOverride === slideId;
                
                let name = slideId;
                let desc = "";
                if (slideId.startsWith("agenda_day_")) {
                  const dayIdx = parseInt(slideId.replace("agenda_day_", ""), 10);
                  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
                  name = `Agenda: ${days[dayIdx]}`;
                  desc = "Programação semanal";
                } else if (slideId.startsWith("verse_")) {
                  const offset = parseInt(slideId.replace("verse_", ""), 10) || 0;
                  name = `Versículo ${offset}`;
                  desc = "Leitura de versículo bíblico";
                } else if (slideId.startsWith("custom_")) {
                  const media = customMediaList.find(m => m.id === slideId);
                  name = media ? media.name : "Mídia Customizada";
                  desc = media ? `Mídia: ${media.type === 'image' ? 'Imagem' : 'Vídeo'}` : "Mídia da fila";
                } else {
                  switch (slideId) {
                    case 'seat': name = "Fique à vontade"; desc = "Procurar assento"; break;
                    case 'bathroom': name = "Vá ao banheiro"; desc = "Ir antes de começar"; break;
                    case 'phone': name = "Celular no Silencioso"; desc = "Evitar interrupções"; break;
                    case 'no_chat': name = "Silêncio / Concentração"; desc = "Desligar de conversas"; break;
                    case 'soon': name = "Começa em Instantes"; desc = "Contador curto final"; break;
                    case 'social': name = "Redes Sociais"; desc = "@universaljardimosasco"; break;
                    case 'donations': name = "Doações / Dízimos"; desc = "QR Code e dados PIX"; break;
                    case 'campaigns': name = "Campanhas da Igreja"; desc = "Fogueira Santa e Jejum"; break;
                    case 'world_god': name = "Universal pelo Mundo"; desc = "Fotos de templos globais"; break;
                  }
                }

                return (
                  <button
                    key={slideId}
                    onClick={() => updateStateAndBroadcast('manualSlideOverride', slideId)}
                    className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group cursor-pointer ${
                      isActive
                        ? "bg-stone-900 border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.1)]"
                        : "bg-stone-900/40 border-stone-850 hover:bg-stone-900 hover:border-stone-700"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-bl uppercase tracking-wider">
                        No Ar
                      </div>
                    )}
                    <h3 className={`font-bold text-sm ${isActive ? "text-yellow-500" : "text-white group-hover:text-yellow-500/80"}`}>
                      {name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">{desc}</p>
                    <div className="flex items-center justify-between mt-3 text-[10px] text-stone-400">
                      <span className="font-mono bg-stone-800 px-1.5 py-0.5 rounded text-stone-400">
                        {getSlideDuration(slideId, customMediaList) / 1000}s
                      </span>
                      {isOverridden && (
                        <span className="text-yellow-500 font-bold uppercase tracking-wider text-[9px]">
                          Fixo
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* GERENCIADOR DE IMAGENS E VÍDEOS */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 mb-4 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Film className="w-4 h-4 text-yellow-500" />
                  Mídias Customizadas (Fila)
                </h2>
                <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  IndexedDB Ativo
                </span>
              </div>

              {/* UPLOAD BOX */}
              <div className="relative border-2 border-dashed border-stone-850 hover:border-stone-700 rounded-xl p-4 transition-all bg-stone-950/20 text-center group cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <Plus className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-white">Clique para Adicionar Imagem ou Vídeo</p>
                    <p className="text-[10px] text-stone-500 mt-1">Imagens (JPG/PNG) ou Vídeos (MP4)</p>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="flex items-center justify-center gap-2.5 text-xs text-yellow-500 bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processando e salvando arquivo de mídia...</span>
                </div>
              )}

              {uploadError && (
                <div className="text-red-500 text-[11px] leading-tight bg-red-950/20 border border-red-900/30 p-3 rounded-xl text-left">
                  {uploadError}
                </div>
              )}

              {/* MEDIA LIST */}
              {customMediaList.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-4 italic">Nenhuma imagem ou vídeo adicionado ainda.</p>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {customMediaList.map((media) => {
                    const isSlideActive = currentSlideId === media.id;
                    const isSlideOverridden = manualSlideOverride === media.id;

                    return (
                      <div
                        key={media.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 bg-stone-900/60 ${
                          isSlideActive
                            ? "border-yellow-500/50 shadow-[0_2px_10px_rgba(234,179,8,0.05)]"
                            : "border-stone-850"
                        }`}
                      >
                        {/* Preview / Icon */}
                        <div className="w-12 h-12 rounded-lg bg-stone-950/80 flex items-center justify-center overflow-hidden flex-shrink-0 relative border border-stone-800">
                          {media.type === 'image' ? (
                            <img src={media.url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Film className="w-5 h-5 text-yellow-500" />
                          )}
                          <div className="absolute bottom-0 right-0 bg-stone-950/80 px-1 py-0.5 text-[8px] font-bold text-stone-400 uppercase rounded-tl border-t border-l border-stone-800">
                            {media.type === 'image' ? 'Img' : 'Vid'}
                          </div>
                        </div>

                        {/* Info & Controls */}
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-xs font-bold text-white truncate" title={media.name}>
                            {media.name}
                          </h4>
                          
                          <div className="flex items-center gap-3 mt-1.5">
                            {/* Duration control for images, read-only for videos */}
                            {media.type === 'image' ? (
                              <div className="flex items-center gap-1 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-850">
                                <span className="text-[10px] text-stone-500 font-medium">Tempo:</span>
                                <span className="text-[10px] text-yellow-500 font-bold font-mono">{media.duration / 1000}s</span>
                                <div className="flex flex-col ml-1">
                                  <button
                                    onClick={async () => {
                                      const newDur = Math.max(2000, media.duration + 1000);
                                      const dbItems = await getAllMediaItems();
                                      const target = dbItems.find(item => item.id === media.id);
                                      if (target) {
                                        target.duration = newDur;
                                        await saveMediaItem(target);
                                        updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                      }
                                    }}
                                    className="text-stone-500 hover:text-stone-300 hover:scale-110 active:scale-95 cursor-pointer leading-none"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const newDur = Math.max(2000, media.duration - 1000);
                                      const dbItems = await getAllMediaItems();
                                      const target = dbItems.find(item => item.id === media.id);
                                      if (target) {
                                        target.duration = newDur;
                                        await saveMediaItem(target);
                                        updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                      }
                                    }}
                                    className="text-stone-500 hover:text-stone-300 hover:scale-110 active:scale-95 cursor-pointer leading-none"
                                  >
                                    ▼
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-stone-950 px-2 py-0.5 rounded border border-stone-850 text-[10px] text-stone-400 font-medium font-mono">
                                🎬 {(media.duration / 1000).toFixed(1)}s (Completo)
                              </div>
                            )}

                            {/* Enabled in loop checkbox */}
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-stone-400 select-none">
                              <input
                                type="checkbox"
                                checked={media.enabledInLoop}
                                onChange={async (e) => {
                                  const dbItems = await getAllMediaItems();
                                  const target = dbItems.find(item => item.id === media.id);
                                  if (target) {
                                    target.enabledInLoop = e.target.checked;
                                    await saveMediaItem(target);
                                    updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                  }
                                }}
                                className="rounded border-stone-800 bg-stone-950 text-yellow-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                              />
                              <span>Fila Automática</span>
                            </label>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              updateStateAndBroadcast('manualSlideOverride', isSlideOverridden ? null : media.id);
                            }}
                            title={isSlideOverridden ? "Voltar ao Automático" : "Projetar esta mídia agora"}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                              isSlideOverridden
                                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                                : "bg-stone-800 hover:bg-stone-750 text-yellow-500"
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={async () => {
                              if (confirm(`Tem certeza que deseja excluir "${media.name}"?`)) {
                                if (currentSlideId === media.id || manualSlideOverride === media.id) {
                                  updateStateAndBroadcast('manualSlideOverride', null);
                                }
                                await deleteMediaItem(media.id);
                                updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                              }
                            }}
                            title="Excluir Mídia"
                            className="p-1.5 bg-stone-800 hover:bg-red-950/40 text-stone-400 hover:text-red-500 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GERENCIADOR DE VERSÍCULOS E MENSAGENS CUSTOMIZADAS */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 mt-1 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-yellow-500" />
                  Controle de Versículos e Textos
                </h2>
                
                {(activeVerseIndex !== null || customVerseText) && (
                  <button
                    onClick={() => {
                      updateStateAndBroadcast('activeVerseIndex', null);
                      updateStateAndBroadcast('customVerseText', null);
                      updateStateAndBroadcast('customVerseRef', null);
                    }}
                    className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 hover:bg-yellow-500/20 transition-all cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Resetar Versículo
                  </button>
                )}
              </div>

              {/* Status information */}
              <div className="text-xs border-b border-stone-850/50 pb-3">
                {customVerseText ? (
                  <div>
                    <span className="text-stone-500">Exibindo Texto Livre:</span>
                    <p className="font-bold text-yellow-500 italic mt-0.5">"{customVerseText}"</p>
                    <p className="text-stone-400 text-[10px] mt-0.5">— {customVerseRef || "Sem ref"}</p>
                  </div>
                ) : activeVerseIndex !== null ? (
                  <div>
                    <span className="text-stone-500">Exibindo Versículo Fixo ({activeVerseIndex + 1}/{VERSES.length}):</span>
                    <p className="font-bold text-yellow-500 italic mt-0.5">"{VERSES[activeVerseIndex].text}"</p>
                    <p className="text-stone-400 text-[10px] mt-0.5">— {VERSES[activeVerseIndex].ref}</p>
                  </div>
                ) : (
                  <span className="text-stone-500 font-medium">🔄 Versículos rotacionando automaticamente de 15 em 15 segundos.</span>
                )}
              </div>

              {/* SHUFFLE BUTTON AND AUTOMATIC TOGGLE */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const randomIdx = Math.floor(Math.random() * VERSES.length);
                    updateStateAndBroadcast('customVerseText', null);
                    updateStateAndBroadcast('customVerseRef', null);
                    updateStateAndBroadcast('activeVerseIndex', randomIdx);
                  }}
                  className="bg-stone-900 border border-stone-850 hover:border-stone-700 hover:bg-stone-850 text-stone-200 text-xs font-bold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Shuffle className="w-4 h-4 text-yellow-500" />
                  Embaralhar Versículo
                </button>
                
                <button
                  onClick={() => {
                    updateStateAndBroadcast('activeVerseIndex', null);
                    updateStateAndBroadcast('customVerseText', null);
                    updateStateAndBroadcast('customVerseRef', null);
                  }}
                  disabled={activeVerseIndex === null && !customVerseText}
                  className={`border text-xs font-bold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all ${
                    activeVerseIndex === null && !customVerseText
                      ? "bg-stone-950 border-stone-900 text-stone-600 cursor-not-allowed"
                      : "bg-stone-900 border-stone-850 hover:border-stone-700 hover:bg-stone-850 text-stone-200"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-yellow-500" />
                  Voltar ao Automático
                </button>
              </div>

              {/* TABS SELECTOR */}
              <div className="flex border-b border-stone-850/40 pb-1 mt-1">
                <button
                  onClick={() => setBibleTab('favorites')}
                  className={`flex-1 pb-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    bibleTab === 'favorites'
                      ? "border-yellow-500 text-yellow-500"
                      : "border-transparent text-stone-500 hover:text-stone-300"
                  }`}
                >
                  Favoritos ({VERSES.length})
                </button>
                <button
                  onClick={() => setBibleTab('api')}
                  className={`flex-1 pb-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    bibleTab === 'api'
                      ? "border-yellow-500 text-yellow-500"
                      : "border-transparent text-stone-500 hover:text-stone-300"
                  }`}
                >
                  Bíblia Online (API)
                </button>
              </div>

              {bibleTab === 'favorites' ? (
                /* LIST OF AVAILABLE BIBLE VERSES */
                <div>
                  <label className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">Selecionar Versículo da Bíblia (ACF/ARA)</label>
                  <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1 border border-stone-850/60 bg-stone-950/40 p-2 rounded-xl">
                    {VERSES.map((verse, idx) => {
                      const isSelected = activeVerseIndex === idx && !customVerseText;
                      return (
                        <button
                          key={idx}
                          title={verse.ref}
                          onClick={() => {
                            updateStateAndBroadcast('customVerseText', null);
                            updateStateAndBroadcast('customVerseRef', null);
                            updateStateAndBroadcast('activeVerseIndex', idx);
                          }}
                          className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? "bg-yellow-500 text-black font-black scale-105 shadow-[0_2px_8px_rgba(234,179,8,0.25)]"
                              : "bg-stone-900 text-stone-300 border border-stone-850 hover:bg-stone-800 hover:text-white"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* BIBLE ONLINE API SEARCH */
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">
                      Pesquisar Referência na Bíblia
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ex: João 3:16 ou Sl 23:1"
                        value={apiSearchQuery}
                        onChange={(e) => setApiSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleBibleSearch(apiSearchQuery);
                          }
                        }}
                        className="flex-1 bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stone-700 font-sans"
                      />
                      <button
                        onClick={() => handleBibleSearch(apiSearchQuery)}
                        disabled={apiSearchLoading || !apiSearchQuery.trim()}
                        className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-stone-850 disabled:text-stone-600 text-black px-3.5 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all shrink-0"
                      >
                        {apiSearchLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* QUICK SUGGESTIONS */}
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-stone-500 text-[9px] uppercase tracking-wider mr-1">Sugestões:</span>
                    {["João 3:16", "Salmos 23:1", "Isaías 41:10", "Filipenses 4:13"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setApiSearchQuery(suggestion);
                          handleBibleSearch(suggestion);
                        }}
                        className="text-[9px] bg-stone-900/60 border border-stone-850 hover:border-stone-700 text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  {/* ERROR MESSAGE */}
                  {apiSearchError && (
                    <div className="text-red-500 text-[11px] leading-tight bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl text-left">
                      {apiSearchError}
                    </div>
                  )}

                  {/* SEARCH RESULT PREVIEW */}
                  {apiSearchResult && (
                    <div className="bg-stone-950/60 border border-stone-850/60 rounded-xl p-3 flex flex-col gap-2 text-left">
                      <div className="flex items-center justify-between border-b border-stone-900 pb-1.5">
                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                          Prévia Encontrada:
                        </span>
                        <span className="text-stone-300 font-bold text-xs font-mono">
                          {apiSearchResult.ref}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 italic leading-relaxed">
                        "{apiSearchResult.text}"
                      </p>
                      <button
                        onClick={() => {
                          updateStateAndBroadcast('activeVerseIndex', null);
                          updateStateAndBroadcast('customVerseText', apiSearchResult.text);
                          updateStateAndBroadcast('customVerseRef', apiSearchResult.ref);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black text-[11px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 mt-1 transition-all cursor-pointer shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Projetar na Tela Grande
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CUSTOM TEXT TRANSMITTER FORM */}
              <div className="border-t border-stone-850 pt-4 flex flex-col gap-3">
                <div>
                  <label className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">Projetar Texto / Versículo Personalizado</label>
                  <textarea
                    id="operator-custom-verse-textarea"
                    placeholder="Digite qualquer texto para projetar imediatamente..."
                    rows={2}
                    className="w-full bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stone-700 font-sans resize-none"
                  />
                </div>
                
                <div className="flex gap-2">
                  <input
                    id="operator-custom-verse-ref"
                    type="text"
                    placeholder="Referência (ex: João 3:16)"
                    className="flex-1 bg-stone-900 border border-stone-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-stone-700 font-sans"
                  />
                  <button
                    onClick={() => {
                      const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
                      const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
                      if (textEl && textEl.value.trim()) {
                        updateStateAndBroadcast('activeVerseIndex', null);
                        updateStateAndBroadcast('customVerseText', textEl.value.trim());
                        updateStateAndBroadcast('customVerseRef', refEl.value.trim() || null);
                      }
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" /> Projetar
                  </button>
                  {customVerseText && (
                    <button
                      onClick={() => {
                        const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
                        const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
                        if (textEl) textEl.value = "";
                        if (refEl) refEl.value = "";
                        updateStateAndBroadcast('customVerseText', null);
                        updateStateAndBroadcast('customVerseRef', null);
                      }}
                      className="bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE: TIMERS & ALERTS */}
          <div className={`flex-1 bg-[#090909] p-4 lg:p-6 overflow-y-auto flex flex-col gap-6 ${activeMobileTab === 'controls' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* CONTROLE DE PROJEÇÃO */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Tv className="w-4.5 h-4.5 text-yellow-500" />
                Ações Rápidas de Projeção (2ª Tela)
              </h2>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  onClick={() => updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled)}
                  className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    blackoutEnabled
                      ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                      : "bg-stone-900 border-stone-850 text-stone-300 hover:border-stone-700 hover:bg-stone-900/80"
                  }`}
                >
                  <EyeOff className={`w-6 h-6 ${blackoutEnabled ? "animate-pulse text-white" : "text-stone-400"}`} />
                  <div className="text-center">
                    <p className="font-bold text-xs sm:text-sm">{blackoutEnabled ? "Tela Preta Ativa" : "Tela Preta"}</p>
                    <p className="text-[9px] sm:text-[10px] text-stone-400 font-normal mt-0.5">Oculta toda a saída HDMI</p>
                  </div>
                </button>

                <button
                  onClick={() => updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled)}
                  className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    clearContentEnabled
                      ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                      : "bg-stone-900 border-stone-850 text-stone-300 hover:border-stone-700 hover:bg-stone-900/80"
                  }`}
                >
                  <Sparkles className={`w-6 h-6 ${clearContentEnabled ? "text-black" : "text-stone-400"}`} />
                  <div className="text-center">
                    <p className="font-bold text-xs sm:text-sm">{clearContentEnabled ? "Slides Ocultados" : "Limpar Slide"}</p>
                    <p className="text-[9px] sm:text-[10px] text-stone-400 font-normal mt-0.5">Mantém apenas o fundo</p>
                  </div>
                </button>
              </div>
            </div>
            
            {/* TIMERS SECTION */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5">
              <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider mb-3">Cronômetro de Reunião</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 sm:items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 font-medium">Horário da Próxima Reunião:</p>
                  <p className="text-sm sm:text-lg font-bold text-white mt-1 leading-snug">
                    <span className="text-yellow-500">{nextMeeting.dayName}</span> às {nextMeeting.time} — <span className="text-stone-300 font-normal">{nextMeeting.theme}</span>
                  </p>
                </div>
                
                <div className="text-center bg-[#1a1a1a] border border-stone-800 px-6 py-3 rounded-xl w-full sm:w-auto sm:min-w-[150px]">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tempo Restante</p>
                  <p className="text-3xl font-mono font-black text-yellow-500 tracking-wider mt-0.5">
                    {hoursStr}:{minutesStr}
                  </p>
                </div>
              </div>

              {/* TIMER ACTIONS */}
              <div className="grid grid-cols-4 gap-2 mt-5">
                <button
                  onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 60 * 1000)}
                  className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 1 min
                </button>
                <button
                  onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 5 * 60 * 1000)}
                  className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 5 min
                </button>
                <button
                  onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 60 * 1000)}
                  className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" /> 1 min
                </button>
                <button
                  onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 5 * 60 * 1000)}
                  className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" /> 5 min
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => {
                    if (countdownPaused) {
                      const currentDiffMs = nextMeetingDate.getTime() - new Date().getTime();
                      const currentDiffSec = Math.floor(currentDiffMs / 1000);
                      const targetDiffSec = pausedSeconds || 0;
                      const secondsToAdjust = targetDiffSec - currentDiffSec;
                      updateStateAndBroadcast('countdownOffset', secondsToAdjust * 1000);
                      updateStateAndBroadcast('countdownPaused', false);
                      updateStateAndBroadcast('pausedSeconds', null);
                    } else {
                      updateStateAndBroadcast('countdownPaused', true);
                      updateStateAndBroadcast('pausedSeconds', diffSeconds);
                    }
                  }}
                  className={`text-xs font-bold py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all ${
                    countdownPaused 
                      ? "bg-green-500 hover:bg-green-600 text-black shadow-[0_4px_12px_rgba(34,197,94,0.15)]" 
                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10"
                  }`}
                >
                  {countdownPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {countdownPaused ? "Retomar Contagem" : "Pausar Contagem"}
                </button>
                
                <button
                  onClick={() => {
                    updateStateAndBroadcast('countdownOffset', 0);
                    updateStateAndBroadcast('countdownPaused', false);
                    updateStateAndBroadcast('pausedSeconds', null);
                  }}
                  className="bg-[#1a1a1a] hover:bg-stone-800 text-stone-300 text-xs font-bold py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2 border border-stone-800 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resetar Ajustes
                </button>
              </div>
            </div>

            {/* ALERTS SECTION */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider">Disparador de Alertas Visuais</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateStateAndBroadcast('activeAlert', activeAlert === 'baby' ? null : 'baby')}
                  className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    activeAlert === 'baby'
                      ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_4px_15px_rgba(234,179,8,0.25)]"
                      : "bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-900/80"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {ALERTS.baby.buttonTitle}
                </button>
                <button
                  onClick={() => updateStateAndBroadcast('activeAlert', activeAlert === 'car' ? null : 'car')}
                  className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    activeAlert === 'car'
                      ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_4px_15px_rgba(234,179,8,0.25)]"
                      : "bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-900/80"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {ALERTS.car.buttonTitle}
                </button>
              </div>

              {/* CUSTOM ALERT INPUT */}
              <div className="border-t border-stone-800/80 pt-4 mt-1">
                <label className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">Alerta Personalizado</label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = (form.elements.namedItem('customAlertText') as HTMLInputElement);
                    if (input.value.trim()) {
                      updateStateAndBroadcast('activeAlert', input.value.trim());
                      input.value = "";
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="customAlertText"
                    placeholder="Ex: Mãe da Sofia comparecer à EBI..."
                    className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-stone-600 font-sans"
                  />
                  <button
                    type="submit"
                    className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar
                  </button>
                </form>
              </div>

              {activeAlert && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between text-yellow-500 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                    <span className="text-left leading-snug">
                      <strong>Alerta Ativo:</strong> {activeAlert === 'baby' ? ALERTS.baby.message : activeAlert === 'car' ? ALERTS.car.message : activeAlert}
                    </span>
                  </div>
                  <button
                    onClick={() => updateStateAndBroadcast('activeAlert', null)}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 p-1.5 rounded-full text-yellow-500 transition-colors cursor-pointer ml-3 flex-shrink-0"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: MINIATURE SCREEN PREVIEW */}
          <div className={`w-full lg:w-[32%] border-t lg:border-t-0 lg:border-l border-stone-800 bg-[#080808] p-4 lg:p-6 flex flex-col gap-4 overflow-y-auto ${activeMobileTab === 'monitor' ? 'flex' : 'hidden lg:flex'}`}>
            <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4 text-yellow-500" />
              Monitor de Transmissão
            </h2>

            <div 
              ref={monitorContainerRef}
              className="w-full aspect-video bg-black border border-stone-800 rounded-xl overflow-hidden relative shadow-2xl"
            >
              <div 
                className="absolute origin-top-left pointer-events-none"
                style={{
                  width: '1920px',
                  height: '1080px',
                  transform: `scale(${monitorScale})`
                }}
              >
                <div className="w-full h-full relative select-none font-sans overflow-hidden bg-[#050000] text-white flex flex-col justify-between">
                  <ParticlesBackground />
                  
                  {/* Blackout overlay on miniature */}
                  {blackoutEnabled && (
                    <div className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center">
                      <span className="text-stone-700 font-bold uppercase tracking-[0.25em] text-4xl">
                        Blackout Ativo
                      </span>
                    </div>
                  )}

                  {/* Alert on miniature */}
                  <AnimatePresence>
                    {activeAlert && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[90] bg-yellow-500 text-black px-10 py-6 rounded-[2rem] flex items-center gap-6 border-2 border-yellow-400 max-w-[90%]">
                        <Bell className="w-12 h-12 text-black" strokeWidth={2.5} />
                        <div className="text-left">
                          <h2 className="font-black text-2xl uppercase tracking-widest text-black">Aviso Urgente</h2>
                          <p className="font-bold text-3xl mt-1 text-black">
                            {activeAlert === 'baby' ? ALERTS.baby.message : activeAlert === 'car' ? ALERTS.car.message : activeAlert}
                          </p>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {manualSlideOverride && (
                      <motion.div
                        key={`manual-${manualSlideOverride}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 w-full h-full flex items-center justify-center"
                      >
                        {clearContentEnabled ? null : renderSlide(manualSlideOverride)}
                      </motion.div>
                    )}

                    {!manualSlideOverride && isLooping && (
                      <motion.div
                        key="looping"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex flex-col justify-between"
                      >
                        <header className="h-[145px] px-24 flex items-center justify-between border-b border-white/[0.05] bg-gradient-to-b from-black to-transparent z-40 absolute top-0 left-0 right-0">
                          <div>
                            <h1 className="font-sans font-black text-[3rem] tracking-[0.16em] text-white leading-none uppercase">
                              {CHURCH_INFO.name}
                            </h1>
                            <p className="text-xl font-bold tracking-[0.62em] text-yellow-500 uppercase mt-2">
                              {CHURCH_INFO.location}
                            </p>
                          </div>

                          <div className="flex items-center gap-10">
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-stone-400 tracking-[0.25em] uppercase block mb-1">
                                A Reunião Começa em:
                              </span>
                              <div className="flex items-baseline justify-end gap-1 font-mono text-white text-4xl font-bold tracking-tighter">
                                <span>{hoursStr}</span>
                                <span className="text-base font-sans text-stone-500 uppercase font-bold mr-2">h</span>
                                <span>:</span>
                                <span>{minutesStr}</span>
                                <span className="text-base font-sans text-stone-500 uppercase font-bold">m</span>
                              </div>
                            </div>
                          </div>
                        </header>

                        <main className="flex-1 flex items-center justify-center relative w-full h-full pt-[145px]">
                          {clearContentEnabled ? null : renderSlide(currentSlideId)}
                        </main>
                      </motion.div>
                    )}

                    {!manualSlideOverride && isFinalFiveMinutes && (
                      <motion.div
                        key="final-five"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex w-full h-full bg-black relative"
                      >
                        <div className="w-[35%] h-full flex flex-col items-center justify-center border-r border-white/[0.05] bg-[#030000] z-20">
                          <span className="text-yellow-500 text-[2rem] font-bold uppercase tracking-[0.4em] mb-4">
                            Faltam
                          </span>
                          <div className="relative h-[12rem] w-full flex items-center justify-center overflow-hidden">
                            <AnimatePresence mode="popLayout">
                              <motion.div
                                key={diffSeconds}
                                initial={{ opacity: 0, y: 25 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -25 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute font-mono text-[7.5rem] text-white font-black leading-none tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                              >
                                {formatMinutesPart}:{formatSecondsPart}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                          <span className="text-stone-400 text-2xl font-medium tracking-[0.25em] mt-5 uppercase">
                            Minutos e Segundos
                          </span>
                        </div>
                        <div className="w-[65%] h-full flex items-center justify-center relative overflow-hidden bg-black bg-gradient-to-b from-black/20 to-black/80">
                          <div className="w-[1920px] h-[1080px] absolute transform scale-[0.65] origin-center flex flex-col items-center justify-center">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={currentSlideId}
                                {...getTransitionVariants(currentSlideId)}
                                className="w-full h-full flex items-center justify-center"
                              >
                                {clearContentEnabled ? null : renderSlide(currentSlideId)}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {!manualSlideOverride && isFinalMinute && (
                      <motion.div
                        key="final-minute"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-black relative overflow-hidden"
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-yellow-600/10 blur-[200px] rounded-full pointer-events-none" />
                        
                        <span className="text-yellow-500 text-3xl font-bold uppercase tracking-[0.5em] mb-8 animate-pulse z-10">
                          A Reunião Começa Em
                        </span>
                        
                        <div className="relative h-[24rem] w-full flex items-center justify-center overflow-hidden z-10">
                          <AnimatePresence mode="popLayout">
                            <motion.div
                              key={diffSeconds}
                              initial={{ opacity: 0, y: 60 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -60 }}
                              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              className="absolute font-sans text-[24rem] text-white font-black leading-none tracking-tighter drop-shadow-[0_0_80px_rgba(255,255,255,0.15)] tabular-nums"
                            >
                              {diffSeconds}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                        
                        <span className="text-stone-300 text-5xl font-medium tracking-[0.3em] mt-12 uppercase z-10">
                          {diffSeconds === 1 ? "Segundo" : "Segundos"}
                        </span>
                      </motion.div>
                    )}

                    {!manualSlideOverride && isJustStarted && (
                      <motion.div
                        key="just-started"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 w-full h-full"
                      >
                        <VerseSlide 
                          currentTime={currentTime} 
                          customVerseText={customVerseText} 
                          customVerseRef={customVerseRef} 
                          activeVerseIndex={activeVerseIndex} 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed mt-2 border-t border-stone-850 pt-4">
              <strong>Guia de Transmissão:</strong>
              <br />
              1. Conecte o projetor ou TV na saída HDMI da sua máquina.
              <br />
              2. Clique no botão amarelo <strong>"Abrir Projeção (2ª Tela)"</strong>.
              <br />
              3. Arraste a nova aba aberta para a TV ou Projetor.
              <br />
              4. Na janela da TV, clique e aperte a tecla <strong>F</strong> para ativar a tela cheia e ocultar os controles.
              <br />
              5. Use este painel para monitorar, trocar slides e disparar alertas instantâneos!
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={`w-screen h-screen bg-black overflow-hidden relative select-none font-sans flex items-center justify-center cursor-none`}>
      
      {/* MAIN 16:9 SCREEN FRAME */}
      <div
        id="painel-16-9"
        style={{
          width: '1920px',
          height: '1080px',
          transform: `translate(-50%, -50%) rotate(${shouldRotate ? '90deg' : '0deg'}) scale(${scale})`,
          position: 'absolute',
          left: '50%',
          top: '50%',
        }}
        className="bg-[#050000] text-white shadow-[0_0_250px_rgba(0,0,0,0.99)] overflow-hidden flex flex-col z-10"
      >
        <ParticlesBackground />

        {/* BLACKOUT OVERLAY FOR PROJECTION */}
        {blackoutEnabled && (
          <div className="absolute inset-0 bg-black z-[100]" />
        )}

        {/* VISUAL ALERT OVERLAY */}
        <AnimatePresence>
          {activeAlert && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-[90] bg-yellow-500 text-black px-12 py-7 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex items-center gap-8 border-2 border-yellow-400 min-w-[700px] max-w-[90%]"
            >
              <Bell className="w-14 h-14 animate-[bounce_2s_infinite] text-black" strokeWidth={2.5} />
              <div className="text-left flex-1">
                <h2 className="font-black text-2xl uppercase tracking-widest leading-none text-black">Aviso Importante</h2>
                <p className="font-bold text-3xl mt-2 text-black leading-snug">
                  {activeAlert === 'baby' ? ALERTS.baby.message : activeAlert === 'car' ? ALERTS.car.message : activeAlert}
                </p>
              </div>
              <button 
                onClick={() => updateStateAndBroadcast('activeAlert', null)}
                className="bg-black/10 hover:bg-black/25 p-3 rounded-full transition-colors cursor-pointer pointer-events-auto shrink-0 flex items-center justify-center"
              >
                <X className="w-7 h-7 text-black" strokeWidth={2.5} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          {manualSlideOverride && (
            <motion.div
              key={`manual-${manualSlideOverride}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              {clearContentEnabled ? null : renderSlide(manualSlideOverride)}
            </motion.div>
          )}

          {!manualSlideOverride && isLooping && (
            <motion.div
              key="looping"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col justify-between"
            >
              <header className="h-[145px] px-24 flex items-center justify-between border-b border-white/[0.05] bg-gradient-to-b from-black to-transparent z-40 absolute top-0 left-0 right-0">
                <div>
                  <h1 className="font-sans font-black text-[3rem] tracking-[0.16em] text-white leading-none uppercase">
                    {CHURCH_INFO.name}
                  </h1>
                  <p className="text-xl font-bold tracking-[0.62em] text-yellow-500 uppercase mt-2">
                    {CHURCH_INFO.location}
                  </p>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-stone-400 tracking-[0.25em] uppercase block mb-1">
                      A Reunião Começa em:
                    </span>
                    <div className="flex items-baseline justify-end gap-1 font-mono text-white text-4xl font-bold tracking-tighter">
                      <span>{hoursStr}</span>
                      <span className="text-base font-sans text-stone-500 uppercase font-bold mr-2">h</span>
                      <span className="text-yellow-500 animate-pulse">:</span>
                      <span>{minutesStr}</span>
                      <span className="text-base font-sans text-stone-500 uppercase font-bold">m</span>
                    </div>
                  </div>
                  
                  <div className="h-12 w-[1px] bg-white/[0.1]" />
                  
                  <div className="bg-white/[0.02] border border-white/[0.05] px-6 py-3 rounded-xl flex flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-bold tracking-wider text-stone-200">
                      {format(currentTime, 'HH:mm:ss')}
                    </span>
                    <span className="font-sans text-xs tracking-[0.2em] text-stone-500 uppercase mt-1">
                      {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </header>

              <main className="flex-1 flex items-center justify-center relative w-full h-full pt-[145px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlideId}
                    {...getTransitionVariants(currentSlideId)}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {clearContentEnabled ? null : renderSlide(currentSlideId)}
                  </motion.div>
                </AnimatePresence>
              </main>
            </motion.div>
          )}

          {!manualSlideOverride && isFinalFiveMinutes && (
            <motion.div
              key="final-five"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex w-full h-full bg-black relative"
            >
              <div className="w-[35%] h-full flex flex-col items-center justify-center border-r border-white/[0.05] bg-[#030000] z-20">
                <span className="text-yellow-500 text-[2rem] font-bold uppercase tracking-[0.4em] mb-4">
                  Faltam
                </span>
                <div className="relative h-[12rem] w-full flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={diffSeconds}
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -25 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute font-mono text-[7.5rem] text-white font-black leading-none tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                    >
                      {formatMinutesPart}:{formatSecondsPart}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <span className="text-stone-400 text-2xl font-medium tracking-[0.25em] mt-5 uppercase">
                  Minutos e Segundos
                </span>
              </div>
              <div className="w-[65%] h-full flex items-center justify-center relative overflow-hidden bg-black bg-gradient-to-b from-black/20 to-black/80">
                <div className="w-[1920px] h-[1080px] absolute transform scale-[0.65] origin-center flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlideId}
                      {...getTransitionVariants(currentSlideId)}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {clearContentEnabled ? null : renderSlide(currentSlideId)}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {!manualSlideOverride && isFinalMinute && (
            <motion.div
              key="final-minute"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-black relative overflow-hidden"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-yellow-600/10 blur-[200px] rounded-full pointer-events-none" />
              
              <span className="text-yellow-500 text-3xl font-bold uppercase tracking-[0.5em] mb-8 animate-pulse z-10">
                A Reunião Começa Em
              </span>
              
              <div className="relative h-[24rem] w-full flex items-center justify-center overflow-hidden z-10">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={diffSeconds}
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -60 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute font-sans text-[24rem] text-white font-black leading-none tracking-tighter drop-shadow-[0_0_80px_rgba(255,255,255,0.15)] tabular-nums"
                  >
                    {diffSeconds}
                  </motion.div>
                </AnimatePresence>
              </div>
              
              <span className="text-stone-300 text-5xl font-medium tracking-[0.3em] mt-12 uppercase z-10">
                {diffSeconds === 1 ? "Segundo" : "Segundos"}
              </span>
            </motion.div>
          )}

          {!manualSlideOverride && isJustStarted && (
            <motion.div
              key="just-started"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full"
            >
              <VerseSlide 
                currentTime={currentTime} 
                customVerseText={customVerseText} 
                customVerseRef={customVerseRef} 
                activeVerseIndex={activeVerseIndex} 
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {shouldRotate && (
        <div className="absolute top-6 left-6 z-50 bg-black/95 text-white border border-stone-800 rounded-xl px-5 py-3 text-sm flex items-center gap-2 font-medium pointer-events-none tracking-wide shadow-xl backdrop-blur-md animate-pulse">
          <Tv className="w-5 h-5 text-yellow-500" />
          <span>📺 Modo Widescreen Bloqueado. Deite a tela.</span>
        </div>
      )}

      {/* FULLSCREEN FLOATING TOGGLE BUTTON */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-6 right-6 z-50 bg-black/80 hover:bg-black/95 text-white border border-stone-800 hover:border-stone-600 rounded-full p-4 shadow-xl backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-2 group lg:hidden"
        aria-label="Alternar Tela Cheia"
      >
        {isFullscreen ? (
          <Minimize className="w-6 h-6 text-yellow-500" />
        ) : (
          <Maximize className="w-6 h-6 text-yellow-500" />
        )}
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap text-stone-200 text-sm font-semibold pr-0 group-hover:pr-2">
          {isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        </span>
      </button>

    </div>
  );
}

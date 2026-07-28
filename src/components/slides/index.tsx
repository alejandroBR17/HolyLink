import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Flame, 
  HeartHandshake, 
  CalendarDays, 
  WifiOff, 
  MessageSquareOff, 
  AlertTriangle,
  Radio,
  Gamepad2,
  Users2,
  Smartphone,
  Zap,
  Clock,
  Instagram,
  Mic2,
  BookOpen,
  DoorOpen,
  Armchair
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { CHURCH_INFO, DONATION, CAMPAIGNS, WEEK_SCHEDULES } from '../../data';
import { Meeting } from '../../types';

// ==========================================
// REUSABLE ICON SLIDE
// ==========================================
export const IconSlide = ({ icon: Icon, title, subtitle, pulse = false, layout = 'center', variant }: any) => {
  const isFJU = variant === 'fju';
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50 } }
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
          <motion.h1 variants={item} className={`font-sans font-black text-[7.5rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_10px_30px_rgba(245,158,11,0.3)]' : 'text-white'} leading-none mb-8`}>
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
          <Icon className={`w-[450px] h-[450px] ${isFJU ? 'text-amber-500 drop-shadow-[0_0_80px_rgba(245,158,11,0.2)]' : 'text-yellow-500'} opacity-80 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1} />
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
          <Icon className={`w-[450px] h-[450px] ${isFJU ? 'text-amber-500 drop-shadow-[0_0_80px_rgba(245,158,11,0.3)]' : 'text-yellow-500'} opacity-80 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1} />
        </motion.div>
        <div className="flex-1 text-right pl-20">
          <motion.h1 variants={item} className={`font-sans font-black text-[8.5rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_10px_30px_rgba(245,158,11,0.3)]' : 'text-white'} leading-none mb-8`}>
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
        <Icon className={`w-64 h-64 ${isFJU ? 'text-amber-500 drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]' : 'text-yellow-500'} mb-12 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
      </motion.div>
      <motion.h1 variants={item} className={`font-sans font-black text-[8.5rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_10px_40px_rgba(245,158,11,0.3)]' : 'text-white'} leading-none mb-8 uppercase`}>
        {title}
      </motion.h1>
      <motion.p variants={item} className={`text-[4rem] ${isFJU ? 'text-stone-100' : 'text-stone-200'} font-medium mt-4 leading-snug max-w-[95%]`}>
        {subtitle}
      </motion.p>
      {isFJU && (
        <motion.div 
          variants={item}
          className="mt-16 flex gap-8 items-center"
        >
          <div className="flex gap-4">
            <div className="w-4 h-4 rounded-full bg-amber-600 animate-ping delay-0" />
            <div className="w-4 h-4 rounded-full bg-amber-400 animate-ping delay-300" />
            <div className="w-4 h-4 rounded-full bg-white animate-ping delay-600" />
          </div>
          <div className="px-6 py-2 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm">
            <span className="text-white font-black tracking-[0.3em] text-2xl uppercase italic">FJU</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// ==========================================
// SPECIAL SLIDES
// ==========================================

export const WorldGodSlide = ({ variant }: { variant?: string }) => {
  const [phase, setPhase] = useState<'world' | 'god'>('world');
  const isFJU = variant === 'fju';
  
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
            <Globe className={`w-64 h-64 ${isFJU ? 'text-amber-500/50' : 'text-stone-500'} mb-14 animate-[spin_20s_linear_infinite]`} strokeWidth={1} />
            <h1 className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none uppercase">
              {isFJU ? 'Cola com a gente' : 'Desligue-se do mundo'}
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
              <Flame className={`w-64 h-64 ${isFJU ? 'text-amber-500' : 'text-yellow-500'} mb-14`} strokeWidth={1.5} />
            </motion.div>
            <h1 className={`font-sans font-black text-[7.5rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_0_40px_rgba(245,158,11,0.3)]' : 'text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]'} leading-none uppercase`}>
              {isFJU ? 'Vem pra FJU' : 'Ligue-se com Deus'}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AgendaDaySlide = ({ 
  dayIndex, 
  subType = 'all',
  currentTime, 
  meetings = [],
  variant
}: { 
  dayIndex: number; 
  subType?: 'causas' | 'fju' | 'all';
  currentTime: Date; 
  meetings?: Meeting[];
  variant?: string;
}) => {
  const isToday = currentTime.getDay() === dayIndex;
  const isFJU = variant === 'fju';
  
  // Calcula a data exata do dayIndex para a semana atual
  const startOfWeek = new Date(currentTime);
  startOfWeek.setDate(currentTime.getDate() - currentTime.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const targetDayDate = new Date(startOfWeek);
  targetDayDate.setDate(startOfWeek.getDate() + dayIndex);
  
  const targetYear = targetDayDate.getFullYear();
  const targetMonth = String(targetDayDate.getMonth() + 1).padStart(2, '0');
  const targetDay = String(targetDayDate.getDate()).padStart(2, '0');
  const targetDayStr = `${targetYear}-${targetMonth}-${targetDay}`;

  // Filtra as reuniões que ocorrem neste dia específico (recorrentes ou pontuais do dia correspondente da semana atual)
  let dayMeetings = (meetings.length > 0 ? meetings : []).filter(m => {
    if (m.date) {
      return m.date === targetDayStr;
    }
    return m.day === dayIndex;
  });

  // Se for Sábado, separa entre Causas Impossíveis e FJU/Teens se solicitado
  if (dayIndex === 6) {
    if (subType === 'causas') {
      dayMeetings = dayMeetings.filter(m => {
        const tLower = m.theme.toLowerCase();
        return m.hours < 12 || tLower.includes('causa') || tLower.includes('jejum');
      });
    } else if (subType === 'fju') {
      dayMeetings = dayMeetings.filter(m => {
        const tLower = m.theme.toLowerCase();
        return m.hours >= 12 || tLower.includes('jovem') || tLower.includes('fju') || tLower.includes('teen') || tLower.includes('conex');
      });
    }
  }

  const defaultSchedule = WEEK_SCHEDULES.find(s => s.dayIndex === dayIndex) || WEEK_SCHEDULES[0];
  
  let theme = defaultSchedule?.theme || "Reunião de Fé";
  if (dayIndex === 6) {
    if (subType === 'causas') {
      theme = "Jejum das\nCausas Impossíveis";
    } else if (subType === 'fju') {
      theme = "Força Jovem Universal";
    }
  }

  const formattedTimes = dayMeetings
    .sort((a, b) => (a.hours * 60 + a.minutes) - (b.hours * 60 + b.minutes))
    .map(m => {
      // Formata o tema ou indica se for pontual especial
      const isSpecialEvent = !!m.date;
      const timeStr = m.minutes === 0 ? `${m.hours}h` : `${m.hours}h${String(m.minutes).padStart(2, '0')}`;
      return {
        time: timeStr,
        theme: m.theme,
        isSpecial: isSpecialEvent
      };
    });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };
  
  const item = {
    hidden: { opacity: 0, x: -40 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 60 } }
  };
  
  const itemRight = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 60 } }
  };
  
  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="flex items-center justify-between max-w-[95%] w-full px-10"
    >
      <div className={`flex-1 text-left pr-16 border-r ${isFJU ? 'border-amber-500/30' : 'border-white/10'}`}>
        <motion.span variants={item} className={`${isFJU ? 'text-amber-500' : 'text-yellow-500'} font-bold uppercase tracking-[0.4em] mb-6 text-3xl block`}>
          {isToday ? 'Reuniões de Hoje' : 'Agenda Semanal'}
        </motion.span>
        <motion.h3 variants={item} className="text-stone-200 font-bold uppercase tracking-[0.3em] mb-6 text-[2.5rem]">
          {defaultSchedule.dayName}
        </motion.h3>
        <motion.h2 variants={item} className={`text-[7.5rem] ${isFJU ? 'text-white drop-shadow-[0_10px_30px_rgba(245,158,11,0.3)]' : 'text-white'} font-black uppercase tracking-tight leading-none mt-4 whitespace-pre-line`}>
          {theme}
        </motion.h2>
      </div>
      <div className="flex-1 pl-16">
        <motion.div variants={itemRight} className="grid grid-cols-2 gap-6">
          {formattedTimes.length > 0 ? (
            formattedTimes.map((t, i) => (
              <motion.div 
                key={i} 
                className={`border px-10 py-8 rounded-3xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden group transition-all ${
                  t.isSpecial 
                    ? (isFJU ? "bg-amber-600/10 border-amber-500/30 shadow-amber-500/5" : "bg-yellow-500/10 border-yellow-500/30 shadow-yellow-500/5")
                    : "bg-white/[0.03] border-white/[0.08]"
                }`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ${isFJU ? 'bg-amber-500/5' : 'bg-yellow-500/5'}`} />
                <span className={`font-mono text-[4rem] font-black tracking-wider relative z-10 ${t.isSpecial ? (isFJU ? "text-amber-400" : "text-yellow-400") : "text-white"}`}>{t.time}</span>
                {t.isSpecial && (
                  <span className={`absolute top-2 right-3 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90 ${isFJU ? 'bg-amber-500 text-white' : 'bg-yellow-500 text-black'}`}>Especial</span>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center py-10 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
              <span className="text-stone-400 text-2xl">Sem reuniões programadas para este dia.</span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
 
export const DonationSlide = ({ variant }: { variant?: string }) => {
  const isFJU = variant === 'fju';
  
  return (
    <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="flex items-center justify-between w-full max-w-[95%] px-20"
    >
      <div className="flex-1 text-left pr-20">
        <motion.div className="flex items-center gap-4 mb-6">
          <HeartHandshake className={`w-24 h-24 ${isFJU ? 'text-amber-500' : 'text-yellow-500'}`} strokeWidth={1.5} />
          <span className={`${isFJU ? 'text-amber-400' : 'text-yellow-500'} font-bold uppercase tracking-[0.4em] text-3xl`}>
            Dízimos e Ofertas
          </span>
        </motion.div>
        <h1 className={`font-sans font-black text-[7.5rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_10px_30px_rgba(245,158,11,0.2)]' : 'text-white'} leading-none mb-8`}>
          Faça sua <br />Doação
        </h1>
        <p className="text-[3.5rem] text-stone-200 font-normal mt-6 leading-snug max-w-[90%] mb-12">
          Acesse <span className={`${isFJU ? 'text-amber-400' : 'text-yellow-500'} font-bold`}>{DONATION.url.replace(/^https?:\/\//, '')}</span> ou escaneie o QR Code ao lado.
        </p>
        <div className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-2xl inline-block">
           <p className="text-stone-300 text-3xl font-medium">Lembre-se de enviar o comprovante</p>
           <p className="text-stone-400 text-2xl mt-2">O WhatsApp está disponível no site.</p>
        </div>
      </div>
      <motion.div className={`flex-shrink-0 bg-white p-6 rounded-3xl ${isFJU ? 'ring-8 ring-amber-500/30' : ''}`}>
        <QRCode value={DONATION.url} size={480} />
      </motion.div>
    </motion.div>
  );
};
 
export const CampaignSlide = ({ campaigns = [] }: { campaigns?: any[] }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Filtra campanhas que não expiraram (endDate é nula ou maior/igual a hoje)
  const activeCampaigns = (Array.isArray(campaigns) ? campaigns : []).filter(c => {
    if (!c.endDate) return true;
    return c.endDate >= todayStr;
  });

  return (
    <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.8 }}
       className="flex flex-col items-center justify-center w-full min-h-[85vh] px-12"
    >
      <div className="flex items-center gap-4 mb-12">
        <div className="h-[2px] w-12 bg-amber-500/40" />
        <h1 className="font-sans font-bold text-3xl tracking-[0.3em] text-amber-500 uppercase">
          Propósitos Atuais
        </h1>
        <div className="h-[2px] w-12 bg-amber-500/40" />
      </div>

      <div className={`w-full max-w-6xl ${activeCampaigns.length === 1 ? 'flex justify-center' : 'grid grid-cols-2 gap-12'}`}>
        {activeCampaigns.length > 0 ? (
          activeCampaigns.map((campaign, index) => {
            let Icon = Flame;
            const iconKey = campaign.iconType || campaign.type || '';
            if (iconKey === 'wifi_off' || iconKey.includes('daniel')) {
              Icon = WifiOff;
            } else if (iconKey === 'globe' || iconKey.includes('globe') || iconKey.includes('ide')) {
              Icon = Globe;
            } else if (iconKey === 'faith' || iconKey.includes('faith') || iconKey.includes('agenda')) {
              Icon = CalendarDays;
            } else if (iconKey === 'flame' || iconKey.includes('fogo') || iconKey.includes('fogueira')) {
              Icon = Flame;
            }

            if (activeCampaigns.length === 1) {
              // Layout majestoso para 1 campanha
              return (
                <div key={index} className="bg-zinc-950/40 border border-amber-500/20 p-16 rounded-[2.5rem] flex items-center justify-between gap-16 w-full max-w-5xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] to-transparent pointer-events-none" />
                  <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex-1 text-left">
                    <span className="text-amber-500 text-lg uppercase tracking-[0.25em] font-extrabold block mb-4">
                      Em Andamento
                    </span>
                    <h3 className="text-white font-black text-[5.5rem] leading-[1.05] tracking-tight mb-8 whitespace-pre-line drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                      {campaign.title}
                    </h3>
                    <div className="inline-flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 px-6 py-3 rounded-full mt-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-amber-400 text-xl uppercase tracking-wider font-extrabold">
                        {campaign.duration}
                      </span>
                    </div>
                  </div>

                  <div className="p-12 bg-gradient-to-b from-amber-500/[0.08] to-transparent border border-amber-500/20 rounded-[2rem] shadow-inner flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-amber-500/[0.02] animate-pulse rounded-[2rem]" />
                    <Icon className="w-40 h-40 text-amber-500 relative z-10" strokeWidth={1} />
                  </div>
                </div>
              );
            }

            // Layout de Grid refinado para múltiplas campanhas
            return (
              <div key={index} className="bg-zinc-950/30 border border-zinc-800 hover:border-amber-500/30 p-12 rounded-[2rem] flex flex-col items-center text-center shadow-xl relative overflow-hidden group transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.01] to-transparent pointer-events-none" />
                <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />
                
                <div className="p-8 bg-zinc-900/50 border border-zinc-800 group-hover:border-amber-500/25 rounded-2xl mb-8 transition-colors duration-500">
                  <Icon className="w-24 h-24 text-amber-500 group-hover:scale-105 transition-transform duration-500" strokeWidth={1.25} />
                </div>
                
                <h3 className="text-white font-extrabold text-[3.25rem] leading-none mb-6 tracking-tight whitespace-pre-line group-hover:text-amber-100 transition-colors">
                  {campaign.title}
                </h3>
                
                <div className="mt-auto bg-amber-500/5 border border-amber-500/10 px-5 py-2 rounded-full">
                  <p className="text-amber-500 text-sm uppercase tracking-[0.15em] font-extrabold">
                    {campaign.duration}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full max-w-3xl bg-zinc-950/20 border border-zinc-800/80 p-20 rounded-[2rem] flex flex-col items-center text-center shadow-xl">
            <Flame className="w-24 h-24 text-zinc-600 mb-8" strokeWidth={1} />
            <h3 className="text-zinc-300 font-bold text-[2.5rem] tracking-wide mb-4">Consagração Contínua</h3>
            <p className="text-zinc-500 text-xl leading-relaxed max-w-lg">
              Acompanhe as orientações do bispo e pastores para se manter firme em comunhão.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const VideoSlide = ({ media, currentSlideId, videoPinBehavior, onVideoEnded, isBackgroundBlur, volume = 0.5, fit }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasErroredRef = useRef(false);

  useEffect(() => {
    hasErroredRef.current = false;
  }, [media?.id, media?.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !media?.url) return;

    if (!currentSlideId || currentSlideId === media.id) {
      const loadedSrc = video.getAttribute('data-loaded-src');
      if (loadedSrc !== media.url || video.ended) {
        video.setAttribute('data-loaded-src', media.url);
        video.src = media.url;
        video.currentTime = 0;
      }
      
      const safeVol = Math.max(0, Math.min(1, isNaN(volume) ? 0.5 : volume));
      video.volume = isBackgroundBlur ? 0 : safeVol;
      video.muted = isBackgroundBlur || safeVol === 0 ? true : (media.muted !== undefined ? media.muted : false);
      
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
  }, [currentSlideId, media?.id, media?.url, volume, isBackgroundBlur]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !media?.url) return;
    
    // Se o volume mudar enquanto o vídeo está tocando
    if (!currentSlideId || currentSlideId === media.id) {
      const safeVol = Math.max(0, Math.min(1, isNaN(volume) ? 0.5 : volume));
      video.volume = isBackgroundBlur ? 0 : safeVol;
      video.muted = isBackgroundBlur || safeVol === 0 ? true : (media.muted !== undefined ? media.muted : false);
    }
  }, [volume, currentSlideId, media?.id, isBackgroundBlur, media?.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !media?.url) return;
    const safeVol = Math.max(0, Math.min(1, isNaN(volume) ? 0.5 : volume));
    video.muted = isBackgroundBlur || safeVol === 0 ? true : (media.muted !== undefined ? media.muted : false);
  }, [media?.muted, isBackgroundBlur, volume, media?.url]);

  if (!media?.url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/40">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-xs">Carregando mídia...</span>
        </div>
      </div>
    );
  }

  const videoFit = fit || media.fit || 'contain';
  const objectFitClass = videoFit === 'cover' ? "object-cover" : videoFit === 'fill' ? "object-fill" : "object-contain";
  const shouldLoop = videoPinBehavior === 'loop';

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <video
        ref={videoRef}
        src={media.url}
        className={`w-full h-full ${objectFitClass}`}
        playsInline
        controls={false}
        loop={shouldLoop}
        onError={(e) => {
          if (hasErroredRef.current) return;
          hasErroredRef.current = true;
          console.warn("Video playback warning on slide:", media?.id, e);
          const video = videoRef.current;
          if (video) {
            video.muted = true;
            video.play().catch(() => {});
          }
        }}
        onEnded={() => {
          if (shouldLoop) {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch((err) => console.error("Error looping video:", err));
            }
          } else {
            if (!isBackgroundBlur && onVideoEnded) {
              onVideoEnded();
            }
          }
        }}
      />
    </div>
  );
};

export const MeetingEventSlide = ({ meeting, variant, pulse = true }: { meeting: Meeting, variant?: string, pulse?: boolean }) => {
  const isFJU = variant === 'fju';
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50 } }
  };

  let formattedDate = meeting.dayName || "";
  if (meeting.date) {
    try {
      const parts = meeting.date.split('-');
      const dateObj = new Date(meeting.date + 'T12:00:00');
      const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      const dayOfWeekStr = days[dateObj.getDay()];
      const dayVal = parseInt(parts[2], 10);
      const monthStr = months[dateObj.getMonth()];
      
      formattedDate = `${dayOfWeekStr}, ${dayVal} de ${monthStr}`;
    } catch (e) {
      formattedDate = meeting.dayName || meeting.date;
    }
  }

  const Icon = CalendarDays;

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
        <Icon className={`w-56 h-56 ${isFJU ? 'text-amber-500' : 'text-yellow-500'} mb-12 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
      </motion.div>
      <motion.h1 variants={item} className={`font-sans font-black text-[7.5rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_10px_30px_rgba(245,158,11,0.3)]' : 'text-white'} leading-none mb-8`}>
        {meeting.theme}
      </motion.h1>
      <motion.p variants={item} className={`text-[3.5rem] ${isFJU ? 'text-stone-100' : 'text-stone-200'} font-normal mt-4 leading-snug`}>
        {formattedDate} — Às {meeting.time}
      </motion.p>
    </motion.div>
  );
};

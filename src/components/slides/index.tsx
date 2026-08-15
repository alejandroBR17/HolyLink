import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Flame, 
  HeartHandshake, 
  CalendarDays, 
  WifiOff, 
  MessageSquareOff, 
  Smartphone, 
  Clock, 
  Instagram, 
  DoorOpen, 
  Armchair,
  QrCode,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { CHURCH_INFO, DONATION, WEEK_SCHEDULES } from '../../data';
import { Meeting } from '../../types';
import { usePerformanceDiagnostics } from '../../utils/performance';

// ==========================================
// REUSABLE ICON SLIDE (SEAT, PHONE, BATHROOM, SOON, SOCIAL, ETC.)
// ==========================================
export const IconSlide = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  pulse = false, 
  layout = 'center', 
  variant,
  category,
  effectiveMode: propEffectiveMode,
  isLightModeActive: propIsLightMode
}: any) => {
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';
  const isFJU = variant === 'fju';

  // Category badge mapping
  const badgeLabel = category || (
    isFJU ? "FORÇA JOVEM UNIVERSAL" :
    title?.toLowerCase().includes("celular") || title?.toLowerCase().includes("silencioso") ? "REVERÊNCIA E RESPEITO" :
    title?.toLowerCase().includes("assento") || title?.toLowerCase().includes("lugar") || title?.toLowerCase().includes("bem-vindo") ? "CASA DE DEUS" :
    title?.toLowerCase().includes("banheiro") || title?.toLowerCase().includes("instalações") || title?.toLowerCase().includes("aviso") ? "AVISO IMPORTANTE" :
    title?.toLowerCase().includes("instagram") || title?.toLowerCase().includes("redes") ? "COMUNICAÇÃO" :
    title?.toLowerCase().includes("concentração") || title?.toLowerCase().includes("oração") ? "ORAÇÃO E FÉ" :
    title?.toLowerCase().includes("começar") || title?.toLowerCase().includes("instantes") ? "SANTO CULTO" :
    "ORIENTAÇÃO"
  );

  // High-performance smooth transitions
  const containerVariants: any = isLightMode
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.35, ease: "easeInOut" } }
      }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: isHighMode ? 0.1 : 0.06, delayChildren: 0.04 }
        }
      };

  const itemVariants: any = isLightMode
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.35, ease: "easeInOut" } }
      }
    : {
        hidden: { opacity: 0, y: isFJU ? 20 : 12, scale: isFJU ? 0.97 : 0.99 },
        show: { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          transition: { duration: isFJU ? 0.55 : 0.65, ease: [0.16, 1, 0.3, 1] } 
        }
      };

  if (layout === 'split-left') {
    return (
      <div className="flex items-center justify-center h-full w-full px-12 xl:px-20 relative select-none">
        {!isLightMode && (
          <div className={`absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 ${
            isHighMode ? 'w-[750px] h-[750px] blur-[150px]' : 'w-[420px] h-[420px] blur-[70px]'
          } ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/08'} rounded-full pointer-events-none`} />
        )}

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="flex items-center justify-between w-full max-w-[97%] relative z-10"
        >
          {/* Left Text Block */}
          <div className="flex-1 text-left pr-12 xl:pr-20">
            <motion.div 
              variants={itemVariants} 
              className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full mb-6 ${
                isFJU 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : 'bg-white/[0.04] border border-amber-500/25'
              } backdrop-blur-md`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                isFJU ? 'bg-amber-400 animate-ping' : 'bg-amber-400/90'
              }`} />
              <span className={`text-xl xl:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
                isFJU ? 'text-amber-400' : 'text-amber-300/95'
              }`}>
                {badgeLabel}
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants} 
              className={`font-sans font-black text-[6.5rem] xl:text-[8rem] 2xl:text-[9.2rem] tracking-tight leading-[1.02] mb-6 text-white ${
                isLightMode ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' : 'drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
              }`}
            >
              {title}
            </motion.h1>

            <motion.p 
              variants={itemVariants} 
              className={`text-[3.2rem] xl:text-[4rem] 2xl:text-[4.6rem] ${
                isFJU ? 'text-stone-100 font-medium' : 'text-stone-200 font-normal'
              } leading-[1.22] max-w-[95%]`}
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Right Icon Podium */}
          <motion.div 
            variants={itemVariants} 
            className="flex-shrink-0 relative"
          >
            <div className={`p-14 xl:p-18 ${
              isFJU ? 'rounded-[3.5rem]' : 'rounded-3xl'
            } ${
              isLightMode 
                ? 'bg-zinc-950 border-2 border-zinc-800' 
                : isFJU
                  ? 'bg-black/60 backdrop-blur-xl border border-amber-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.75)]'
                  : 'bg-zinc-950/80 backdrop-blur-xl border border-amber-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            } flex items-center justify-center relative overflow-hidden group`}>
              {!isLightMode && (
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  isFJU ? 'from-amber-500/20 via-transparent to-transparent' : 'from-yellow-500/10 via-transparent to-transparent'
                } pointer-events-none`} />
              )}
              <Icon 
                className={`w-[260px] h-[260px] xl:w-[320px] xl:h-[320px] ${
                  isFJU 
                    ? 'text-amber-400 drop-shadow-[0_0_55px_rgba(245,158,11,0.45)]' 
                    : 'text-yellow-400/90 drop-shadow-[0_0_35px_rgba(234,179,8,0.25)]'
                } ${pulse && isHighMode ? (isFJU ? 'animate-pulse' : 'opacity-95') : ''}`} 
                strokeWidth={1.35} 
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (layout === 'split-right') {
    return (
      <div className="flex items-center justify-center h-full w-full px-12 xl:px-20 relative select-none">
        {!isLightMode && (
          <div className={`absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 ${
            isHighMode ? 'w-[750px] h-[750px] blur-[150px]' : 'w-[420px] h-[420px] blur-[70px]'
          } ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/08'} rounded-full pointer-events-none`} />
        )}

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="flex items-center justify-between w-full max-w-[97%] relative z-10"
        >
          {/* Left Icon Podium */}
          <motion.div 
            variants={itemVariants} 
            className="flex-shrink-0 relative"
          >
            <div className={`p-14 xl:p-18 ${
              isFJU ? 'rounded-[3.5rem]' : 'rounded-3xl'
            } ${
              isLightMode 
                ? 'bg-zinc-950 border-2 border-zinc-800' 
                : isFJU
                  ? 'bg-black/60 backdrop-blur-xl border border-amber-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.75)]'
                  : 'bg-zinc-950/80 backdrop-blur-xl border border-amber-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            } flex items-center justify-center relative overflow-hidden group`}>
              {!isLightMode && (
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  isFJU ? 'from-amber-500/20 via-transparent to-transparent' : 'from-yellow-500/10 via-transparent to-transparent'
                } pointer-events-none`} />
              )}
              <Icon 
                className={`w-[260px] h-[260px] xl:w-[320px] xl:h-[320px] ${
                  isFJU 
                    ? 'text-amber-400 drop-shadow-[0_0_55px_rgba(245,158,11,0.45)]' 
                    : 'text-yellow-400/90 drop-shadow-[0_0_35px_rgba(234,179,8,0.25)]'
                } ${pulse && isHighMode ? (isFJU ? 'animate-pulse' : 'opacity-95') : ''}`} 
                strokeWidth={1.35} 
              />
            </div>
          </motion.div>

          {/* Right Text Block */}
          <div className="flex-1 text-right pl-12 xl:pl-20">
            <motion.div 
              variants={itemVariants} 
              className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full mb-6 ${
                isFJU 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : 'bg-white/[0.04] border border-amber-500/25'
              } backdrop-blur-md`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                isFJU ? 'bg-amber-400 animate-ping' : 'bg-amber-400/90'
              }`} />
              <span className={`text-xl xl:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
                isFJU ? 'text-amber-400' : 'text-amber-300/95'
              }`}>
                {badgeLabel}
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants} 
              className={`font-sans font-black text-[6.5rem] xl:text-[8rem] 2xl:text-[9.2rem] tracking-tight leading-[1.02] mb-6 text-white ${
                isLightMode ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' : 'drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
              }`}
            >
              {title}
            </motion.h1>

            <motion.p 
              variants={itemVariants} 
              className={`text-[3.2rem] xl:text-[4rem] 2xl:text-[4.6rem] ${
                isFJU ? 'text-stone-100 font-medium' : 'text-stone-200 font-normal'
              } leading-[1.22] max-w-[95%] ml-auto`}
            >
              {subtitle}
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Layout Center
  return (
    <div className="flex items-center justify-center h-full w-full px-10 xl:px-20 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[800px] h-[800px] blur-[160px]' : 'w-[450px] h-[450px] blur-[70px]'
        } ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="flex flex-col items-center justify-center text-center max-w-[94%] xl:max-w-[88%] relative z-10"
      >
        {/* Category Pill */}
        <motion.div 
          variants={itemVariants} 
          className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full mb-8 ${
            isFJU 
              ? 'bg-amber-500/10 border border-amber-500/30' 
              : 'bg-white/[0.04] border border-amber-500/25'
          } backdrop-blur-md`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${
            isFJU ? 'bg-amber-400 animate-ping' : 'bg-amber-400/90'
          }`} />
          <span className={`text-xl xl:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
            isFJU ? 'text-amber-400' : 'text-amber-300/95'
          }`}>
            {badgeLabel}
          </span>
        </motion.div>

        {/* Center Icon */}
        <motion.div 
          variants={itemVariants}
          className="mb-8"
        >
          <div className={`p-10 xl:p-12 ${
            isFJU ? 'rounded-[3rem]' : 'rounded-3xl'
          } ${
            isLightMode 
              ? 'bg-zinc-950 border-2 border-zinc-800' 
              : isFJU
                ? 'bg-black/60 backdrop-blur-md border border-amber-500/30 shadow-2xl'
                : 'bg-zinc-950/80 backdrop-blur-md border border-amber-500/25 shadow-2xl'
          } inline-flex items-center justify-center`}>
            <Icon 
              className={`w-36 h-36 xl:w-48 xl:h-48 ${
                isFJU 
                  ? 'text-amber-400 drop-shadow-[0_0_45px_rgba(245,158,11,0.45)]' 
                  : 'text-yellow-400/90 drop-shadow-[0_0_30px_rgba(234,179,8,0.25)]'
              } ${pulse && isHighMode ? (isFJU ? 'animate-pulse' : 'opacity-95') : ''}`} 
              strokeWidth={1.35} 
            />
          </div>
        </motion.div>

        <motion.h1 
          variants={itemVariants} 
          className={`font-sans font-black text-[6.5rem] xl:text-[8rem] 2xl:text-[9.2rem] tracking-tight leading-[1.02] mb-6 text-white uppercase ${
            isLightMode ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' : 'drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
          }`}
        >
          {title}
        </motion.h1>

        <motion.p 
          variants={itemVariants} 
          className={`text-[3.2rem] xl:text-[4rem] 2xl:text-[4.6rem] ${
            isFJU ? 'text-stone-100 font-medium' : 'text-stone-200 font-normal'
          } leading-[1.22] max-w-[96%]`}
        >
          {subtitle}
        </motion.p>
      </motion.div>
    </div>
  );
};

// ==========================================
// SPECIAL SLIDES: WORLD & GOD
// ==========================================
export const WorldGodSlide = ({ variant, effectiveMode: propEffectiveMode, isLightModeActive: propIsLightMode }: any) => {
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';
  
  const [phase, setPhase] = useState<'world' | 'god'>('world');
  const isFJU = variant === 'fju';
  
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('god');
    }, 7500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center max-w-6xl h-full w-full relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[850px] h-[850px] blur-[170px]' : 'w-[480px] h-[480px] blur-[75px]'
        } ${phase === 'god' ? (isFJU ? 'bg-amber-600/15' : 'bg-yellow-500/10') : (isFJU ? 'bg-amber-600/10' : 'bg-zinc-400/08')} rounded-full pointer-events-none transition-colors duration-1000`} />
      )}

      <AnimatePresence mode="wait">
        {phase === 'world' ? (
          <motion.div 
            key="world"
            initial={{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isLightMode ? 1 : 1.02 }}
            transition={{ duration: isLightMode ? 0.35 : 0.7, ease: isLightMode ? "easeInOut" : [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center relative z-10"
          >
            <div className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full mb-8 ${
              isFJU 
                ? 'bg-amber-500/10 border border-amber-500/30' 
                : 'bg-white/[0.04] border border-zinc-600/30'
            } backdrop-blur-md`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-amber-400 animate-pulse' : 'bg-zinc-300/80'}`} />
              <span className={`text-xl xl:text-2xl font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-amber-400' : 'text-zinc-300'}`}>
                {isFJU ? 'FORÇA JOVEM UNIVERSAL' : 'PREPARAÇÃO'}
              </span>
            </div>

            <div className={`p-10 ${isFJU ? 'rounded-[3rem]' : 'rounded-3xl'} ${
              isLightMode 
                ? 'bg-zinc-950 border-2 border-zinc-800' 
                : 'bg-zinc-900/70 backdrop-blur-md border border-zinc-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
            } mb-8`}>
              <Globe className={`w-36 h-36 xl:w-44 xl:h-44 ${isFJU ? 'text-amber-400' : 'text-zinc-200 drop-shadow-[0_0_35px_rgba(255,255,255,0.2)]'} ${!isLightMode ? 'animate-[spin_30s_linear_infinite]' : ''}`} strokeWidth={1.3} />
            </div>

            <h1 className="font-sans font-black text-[6.5rem] xl:text-[8rem] 2xl:text-[9rem] tracking-tight text-white leading-none uppercase drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
              {isFJU ? 'Cola com a gente' : 'Desligue-se do mundo'}
            </h1>
            <p className="text-zinc-300 text-[3.2rem] xl:text-[4rem] font-normal mt-6 tracking-wide leading-snug">
              {isFJU ? 'Prepare a mente e esteja pronto para o que Deus vai falar' : 'Prepare sua mente e esteja pronto para ouvir a voz de Deus'}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="god"
            initial={{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isLightMode ? 1 : 1.02 }}
            transition={{ duration: isLightMode ? 0.35 : 0.85, ease: isLightMode ? "easeInOut" : [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center relative z-10"
          >
            <div className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full mb-8 ${
              isFJU ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/[0.04] border border-amber-500/25'
            } backdrop-blur-md`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-amber-400 animate-ping' : 'bg-amber-400/90'}`} />
              <span className={`text-xl xl:text-2xl font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-amber-400' : 'text-amber-300/95'}`}>
                PRESENÇA DE DEUS
              </span>
            </div>

            <div className={`p-10 ${isFJU ? 'rounded-[3rem]' : 'rounded-3xl'} ${
              isLightMode 
                ? 'bg-zinc-950 border-2 border-amber-500/40' 
                : 'bg-zinc-950/80 backdrop-blur-md border border-amber-500/35 shadow-[0_0_50px_rgba(245,158,11,0.2)]'
            } mb-8`}>
              <Flame className={`w-36 h-36 xl:w-44 xl:h-44 ${isFJU ? 'text-amber-400 drop-shadow-[0_0_50px_rgba(245,158,11,0.65)]' : 'text-yellow-400 drop-shadow-[0_0_45px_rgba(234,179,8,0.4)]'}`} strokeWidth={1.35} />
            </div>

            <h1 className={`font-sans font-black text-[6.5rem] xl:text-[8rem] 2xl:text-[9rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_0_60px_rgba(245,158,11,0.45)]' : 'text-yellow-400 drop-shadow-[0_0_50px_rgba(234,179,8,0.35)]'} leading-none uppercase`}>
              {isFJU ? 'Vem pra FJU' : 'Ligue-se com Deus'}
            </h1>
            <p className="text-amber-100/90 text-[3.2rem] xl:text-[4rem] font-normal mt-6 tracking-wide leading-snug">
              {isFJU ? 'O encontro que vai transformar a sua história' : 'Uma reunião de fé que vai abençoar a sua vida'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// AGENDA DAY SLIDE
// ==========================================
export const AgendaDaySlide = ({ 
  dayIndex, 
  subType = 'all',
  currentTime, 
  meetings = [],
  variant,
  effectiveMode: propEffectiveMode,
  isLightModeActive: propIsLightMode
}: { 
  dayIndex: number; 
  subType?: 'causas' | 'fju' | 'all';
  currentTime: Date; 
  meetings?: Meeting[];
  variant?: string;
  effectiveMode?: 'high' | 'balanced' | 'light';
  isLightModeActive?: boolean;
}) => {
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';
  const isToday = currentTime.getDay() === dayIndex;
  const isFJU = variant === 'fju';
  
  // Calculate specific date for dayIndex
  const startOfWeek = new Date(currentTime);
  startOfWeek.setDate(currentTime.getDate() - currentTime.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const targetDayDate = new Date(startOfWeek);
  targetDayDate.setDate(startOfWeek.getDate() + dayIndex);
  
  const targetYear = targetDayDate.getFullYear();
  const targetMonth = String(targetDayDate.getMonth() + 1).padStart(2, '0');
  const targetDay = String(targetDayDate.getDate()).padStart(2, '0');
  const targetDayStr = `${targetYear}-${targetMonth}-${targetDay}`;

  let dayMeetings = (meetings.length > 0 ? meetings : []).filter(m => {
    if (m.date) {
      return m.date === targetDayStr;
    }
    return m.day === dayIndex;
  });

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
      const isSpecialEvent = !!m.date;
      const timeStr = m.minutes === 0 ? `${m.hours}h` : `${m.hours}h${String(m.minutes).padStart(2, '0')}`;
      return {
        time: timeStr,
        theme: m.theme,
        isSpecial: isSpecialEvent
      };
    });

  const containerVariants: any = isLightMode
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.35, ease: "easeInOut" } }
      }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.08, delayChildren: 0.04 }
        }
      };
  
  const itemVariants: any = isLightMode
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.35, ease: "easeInOut" } }
      }
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
      };

  return (
    <div className="flex items-center justify-center h-full w-full px-12 xl:px-20 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[750px] h-[750px] blur-[150px]' : 'w-[420px] h-[420px] blur-[70px]'
        } ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="flex items-center justify-between max-w-[97%] w-full relative z-10"
      >
        {/* Left Column: Day & Theme */}
        <div className={`flex-1 text-left pr-14 xl:pr-20 border-r ${isFJU ? 'border-amber-500/30' : 'border-amber-500/20'}`}>
          <motion.div variants={itemVariants} className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full mb-6 ${
            isToday || isFJU 
              ? 'bg-amber-500/10 border border-amber-500/30' 
              : 'bg-white/[0.04] border border-white/[0.12]'
          } backdrop-blur-md`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              isToday || isFJU ? (isFJU ? 'bg-amber-400 animate-ping' : 'bg-amber-400') : 'bg-yellow-400/80'
            }`} />
            <span className={`text-xl xl:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
              isToday || isFJU ? 'text-amber-400' : 'text-yellow-400'
            }`}>
              {isToday ? 'REUNIÕES DE HOJE' : 'AGENDA DA SEMANA'}
            </span>
          </motion.div>

          <motion.h3 variants={itemVariants} className="text-stone-300 font-extrabold uppercase tracking-[0.25em] mb-4 text-[2.6rem] xl:text-[3.2rem]">
            {defaultSchedule.dayName}
          </motion.h3>

          <motion.h2 variants={itemVariants} className={`text-[6rem] xl:text-[7.5rem] 2xl:text-[8.5rem] ${
            isFJU ? 'text-white drop-shadow-[0_12px_40px_rgba(245,158,11,0.35)]' : 'text-white drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
          } font-black uppercase tracking-tight leading-[1.03] whitespace-pre-line`}>
            {theme}
          </motion.h2>
        </div>

        {/* Right Column: Time Cards Grid */}
        <div className="flex-1 pl-14 xl:pl-20">
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6 xl:gap-8">
            {formattedTimes.length > 0 ? (
              formattedTimes.map((t, i) => (
                <div 
                  key={i} 
                  className={`px-8 py-8 xl:py-10 ${isFJU ? 'rounded-[2.5rem]' : 'rounded-3xl'} border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                    t.isSpecial 
                      ? (isFJU 
                          ? "bg-amber-600/20 border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.25)]" 
                          : "bg-yellow-500/20 border-amber-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]")
                      : (isLightMode 
                          ? "bg-zinc-950 border-zinc-800" 
                          : isFJU
                            ? "bg-black/60 backdrop-blur-md border-white/[0.12] shadow-2xl"
                            : "bg-zinc-950/80 backdrop-blur-md border-amber-500/20 shadow-2xl")
                  }`}
                >
                  <span className={`font-mono text-[4.4rem] xl:text-[5.4rem] 2xl:text-[6.2rem] font-black tracking-wider leading-none relative z-10 ${
                    t.isSpecial 
                      ? (isFJU ? "text-amber-400" : "text-yellow-400") 
                      : "text-white"
                  }`}>
                    {t.time}
                  </span>

                  {t.isSpecial && (
                    <span className={`mt-3 text-sm xl:text-base px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${
                      isFJU ? 'bg-amber-500 text-black' : 'bg-yellow-500 text-black'
                    }`}>
                      Especial
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-14 bg-black/40 border border-white/[0.1] rounded-3xl">
                <span className="text-stone-300 text-3xl font-medium">Sem reuniões programadas para este dia.</span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
 
// ==========================================
// DONATION / FAÇA SUA DOAÇÃO SLIDE
// ==========================================
export const DonationSlide = ({ variant, effectiveMode: propEffectiveMode, isLightModeActive: propIsLightMode }: any) => {
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';
  const isFJU = variant === 'fju';
  
  return (
    <div className="flex items-center justify-center h-full w-full px-12 xl:px-20 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[800px] h-[800px] blur-[160px]' : 'w-[450px] h-[450px] blur-[75px]'
        } ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div
        initial={{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isLightMode ? 0.35 : 0.6, ease: isLightMode ? "easeInOut" : [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between w-full max-w-[97%] relative z-10"
      >
        <div className="flex-1 text-left pr-14 xl:pr-20">
          <div className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full mb-6 ${
            isFJU ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/[0.04] border border-amber-500/25'
          } backdrop-blur-md`}>
            <HeartHandshake className={`w-7 h-7 ${isFJU ? 'text-amber-400' : 'text-yellow-400'}`} strokeWidth={1.5} />
            <span className={`text-xl xl:text-2xl font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-amber-400' : 'text-amber-300/95'}`}>
              DÍZIMOS E OFERTAS
            </span>
          </div>

          <h1 className={`font-sans font-black text-[6.5rem] xl:text-[8rem] 2xl:text-[9.2rem] tracking-tight leading-[1.02] mb-6 text-white ${
            isLightMode ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' : 'drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
          }`}>
            {isFJU ? (
              <>Faça sua <br /><span className="text-amber-400">Doação</span></>
            ) : (
              <>Dízimos e <br /><span className="text-yellow-400">Ofertas</span></>
            )}
          </h1>

          <p className="text-[3rem] xl:text-[3.8rem] 2xl:text-[4.4rem] text-stone-200 font-normal leading-[1.22] max-w-[95%] mb-8">
            Apresente sua fidelidade e gratidão apontando a câmera para o QR Code ao lado ou acesse <span className={`${isFJU ? 'text-amber-400 font-bold' : 'text-yellow-400 font-bold'}`}>{DONATION.url.replace(/^https?:\/\//, '')}</span>
          </p>

          <div className={`p-7 ${isFJU ? 'rounded-3xl' : 'rounded-2xl'} inline-flex items-center gap-5 ${
            isLightMode ? 'bg-zinc-950 border-2 border-zinc-800' : 'bg-zinc-950/80 border border-amber-500/20 backdrop-blur-md'
          }`}>
            <Info className={`w-8 h-8 ${isFJU ? 'text-amber-400' : 'text-yellow-400/90'} shrink-0`} />
            <div>
              <p className="text-stone-100 text-2xl xl:text-3xl font-bold">Lembre-se de enviar o comprovante</p>
              <p className="text-stone-400 text-xl xl:text-2xl mt-1">O contato de WhatsApp está disponível na página de doações.</p>
            </div>
          </div>
        </div>

        {/* QR Code Container with Frame */}
        <div className={`flex-shrink-0 p-8 ${isFJU ? 'rounded-[3.5rem]' : 'rounded-3xl'} ${
          isLightMode 
            ? 'bg-white border-8 border-zinc-800' 
            : isFJU
              ? 'bg-white shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-8 ring-amber-500/30'
              : 'bg-white shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-4 ring-amber-400/30'
        }`}>
          <QRCode value={DONATION.url} size={440} />
          <div className="mt-4 text-center">
            <span className="text-zinc-900 font-mono font-black text-base uppercase tracking-widest">
              QR CODE OFICIAL
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
 
// ==========================================
// CAMPAIGNS SLIDE (PROPÓSITOS ATUAIS)
// ==========================================
export const CampaignSlide = ({ campaigns = [], effectiveMode: propEffectiveMode, isLightModeActive: propIsLightMode }: any) => {
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';
  
  const todayStr = new Date().toISOString().split('T')[0];
  const activeCampaigns = (Array.isArray(campaigns) ? campaigns : []).filter(c => {
    if (!c.endDate) return true;
    return c.endDate >= todayStr;
  });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-12 xl:px-20 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[850px] h-[850px] blur-[170px]' : 'w-[480px] h-[480px] blur-[75px]'
        } bg-amber-600/08 rounded-full pointer-events-none`} />
      )}

      <motion.div
        initial={{ opacity: 0, y: isLightMode ? 0 : 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: isLightMode ? 0.35 : 0.6, ease: isLightMode ? "easeInOut" : "easeOut" }}
        className="w-full flex flex-col items-center justify-center relative z-10"
      >
        <div className="inline-flex items-center gap-3 px-7 py-2.5 rounded-full mb-8 bg-white/[0.04] border border-amber-500/25 backdrop-blur-md">
          <Flame className="w-7 h-7 text-amber-400" />
          <span className="text-xl xl:text-2xl font-black tracking-[0.25em] uppercase font-mono text-amber-300/95">
            PROPÓSITOS ATUAIS
          </span>
        </div>

        <div className={`w-full max-w-6xl ${activeCampaigns.length > 1 ? 'grid grid-cols-2 gap-8' : 'flex justify-center items-center mx-auto'}`}>
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
              }

              if (activeCampaigns.length === 1) {
                return (
                  <div key={index} className={`p-14 xl:p-18 rounded-3xl flex items-center justify-between gap-16 w-full max-w-5xl relative overflow-hidden ${
                    isLightMode ? 'bg-zinc-950 border-2 border-amber-500/30' : 'bg-zinc-950/80 backdrop-blur-xl border border-amber-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
                  }`}>
                    <div className="flex-1 text-left">
                      <span className="text-amber-400 text-2xl uppercase tracking-[0.25em] font-extrabold block mb-4">
                        EM ANDAMENTO
                      </span>
                      <h3 className="text-white font-black text-[5.5rem] xl:text-[6.5rem] leading-[1.03] tracking-tight mb-8 whitespace-pre-line">
                        {campaign.title}
                      </h3>
                      <div className="inline-flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 px-7 py-3.5 rounded-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-amber-400 text-2xl xl:text-3xl uppercase tracking-wider font-black font-mono">
                          {campaign.duration}
                        </span>
                      </div>
                    </div>

                    <div className={`p-12 rounded-2xl ${isLightMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-amber-500/10 border border-amber-500/30 shadow-inner'} flex-shrink-0`}>
                      <Icon className="w-36 h-36 text-amber-400" strokeWidth={1.35} />
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={`p-10 rounded-3xl flex flex-col items-center text-center relative overflow-hidden ${
                  isLightMode ? 'bg-zinc-950 border-2 border-zinc-800' : 'bg-zinc-950/80 backdrop-blur-md border border-amber-500/20 shadow-xl'
                }`}>
                  <div className="p-7 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
                    <Icon className="w-24 h-24 text-amber-400" strokeWidth={1.35} />
                  </div>
                  
                  <h3 className="text-white font-black text-[3.6rem] xl:text-[4.2rem] leading-tight mb-4 tracking-tight whitespace-pre-line">
                    {campaign.title}
                  </h3>
                  
                  <div className="mt-auto bg-amber-500/10 border border-amber-500/30 px-6 py-2.5 rounded-full">
                    <p className="text-amber-400 text-xl xl:text-2xl uppercase tracking-[0.15em] font-black font-mono">
                      {campaign.duration}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`w-full max-w-4xl p-14 rounded-3xl flex flex-col items-center text-center mx-auto ${
              isLightMode ? 'bg-zinc-950 border-2 border-zinc-800' : 'bg-zinc-950/80 backdrop-blur-md border border-amber-500/20'
            }`}>
              <div className="p-7 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
                <Flame className="w-20 h-20 text-amber-400" strokeWidth={1.35} />
              </div>
              <h3 className="text-white font-extrabold text-[3.2rem] xl:text-[3.8rem] tracking-tight mb-4">Ainda Não Há Propósitos em Andamento</h3>
              <p className="text-stone-300 text-2xl xl:text-3xl leading-relaxed max-w-2xl font-normal">
                Procure o pastor da igreja ou um dos nossos obreiros para avivar sua fé e se fortalecer sempre no Senhor.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// VIDEO SLIDE
// ==========================================
export const VideoSlide = ({ media, currentSlideId, videoPinBehavior, onVideoEnded, isBackgroundBlur, volume = 0.5, fit }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeIntervalRef = useRef<any>(null);
  const hasErroredRef = useRef(false);

  useEffect(() => {
    hasErroredRef.current = false;
  }, [media?.id, media?.url]);

  const fadeVolumeTo = (video: HTMLVideoElement, targetVolume: number, durationMs = 200, onComplete?: () => void) => {
    if (!video) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const clampedTarget = Math.max(0, Math.min(1, targetVolume));
    const startVolume = video.volume;
    const steps = 10;
    const stepTime = durationMs / steps;
    let stepCount = 0;

    fadeIntervalRef.current = setInterval(() => {
      stepCount++;
      const currentVal = startVolume + (clampedTarget - startVolume) * (stepCount / steps);
      video.volume = Math.max(0, Math.min(1, currentVal));

      if (stepCount >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        video.volume = clampedTarget;
        if (onComplete) onComplete();
      }
    }, stepTime);
  };

  const playVideoSafely = (video: HTMLVideoElement) => {
    if (!video || document.visibilityState === 'hidden') return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        if (e?.name === 'AbortError' || e?.name === 'NotAllowedError' || (e?.message && e.message.includes('frozen'))) {
          video.muted = true;
          video.play().catch(() => {});
        } else {
          console.warn("Video playback attempt warning:", e?.message || e);
        }
      });
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !media?.url) return;

    const isActive = !currentSlideId || currentSlideId === media.id;

    if (isActive) {
      const loadedSrc = video.getAttribute('data-loaded-src');
      if (loadedSrc !== media.url || video.ended) {
        video.setAttribute('data-loaded-src', media.url);
        video.src = media.url;
        video.currentTime = 0;
      }
      
      const safeVol = Math.max(0, Math.min(1, isNaN(volume) ? 0.5 : volume));
      const targetVol = isBackgroundBlur ? 0 : safeVol;
      video.muted = isBackgroundBlur || targetVol === 0 ? true : (media.muted !== undefined ? media.muted : false);
      
      video.volume = 0;
      playVideoSafely(video);
      if (!video.muted) {
        fadeVolumeTo(video, targetVol, 250);
      }
    } else {
      if (!video.paused) {
        fadeVolumeTo(video, 0, 150, () => {
          video.pause();
        });
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && video) {
        playVideoSafely(video);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [currentSlideId, media?.id, media?.url, volume, isBackgroundBlur]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !media?.url) return;
    
    if (!currentSlideId || currentSlideId === media.id) {
      const safeVol = Math.max(0, Math.min(1, isNaN(volume) ? 0.5 : volume));
      const targetVol = isBackgroundBlur ? 0 : safeVol;
      video.muted = isBackgroundBlur || targetVol === 0 ? true : (media.muted !== undefined ? media.muted : false);
      if (!video.muted) {
        fadeVolumeTo(video, targetVol, 150);
      }
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
            playVideoSafely(video);
          }
        }}
        onEnded={() => {
          if (shouldLoop) {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              playVideoSafely(videoRef.current);
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

// ==========================================
// MEETING EVENT SLIDE
// ==========================================
export const MeetingEventSlide = ({ 
  meeting, 
  variant, 
  pulse = true,
  effectiveMode: propEffectiveMode,
  isLightModeActive: propIsLightMode
}: { 
  meeting: Meeting; 
  variant?: string; 
  pulse?: boolean;
  effectiveMode?: 'high' | 'balanced' | 'light';
  isLightModeActive?: boolean;
}) => {
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';
  const isFJU = variant === 'fju';

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
    <div className="flex items-center justify-center h-full w-full px-12 xl:px-20 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[800px] h-[800px] blur-[160px]' : 'w-[450px] h-[450px] blur-[75px]'
        } ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div 
        initial={{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isLightMode ? 0.35 : 0.6, ease: isLightMode ? "easeInOut" : "easeOut" }}
        className="flex flex-col items-center justify-center text-center max-w-[90%] relative z-10"
      >
        <div className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full mb-8 ${
          isFJU 
            ? 'bg-amber-500/10 border border-amber-500/30' 
            : 'bg-white/[0.04] border border-amber-500/25'
        } backdrop-blur-md`}>
          <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-amber-400 animate-ping' : 'bg-amber-400/90'}`} />
          <span className={`text-xl xl:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
            isFJU ? 'text-amber-400' : 'text-amber-300/95'
          }`}>
            EVENTO ESPECIAL
          </span>
        </div>

        <div className={`p-10 ${isFJU ? 'rounded-[3rem]' : 'rounded-3xl'} ${
          isLightMode 
            ? 'bg-zinc-950 border-2 border-zinc-800' 
            : isFJU
              ? 'bg-black/60 backdrop-blur-md border border-amber-500/30 shadow-2xl'
              : 'bg-zinc-950/80 backdrop-blur-md border border-amber-500/25 shadow-2xl'
        } mb-8`}>
          <Icon className={`w-36 h-36 ${
            isFJU 
              ? 'text-amber-400 drop-shadow-[0_0_45px_rgba(245,158,11,0.45)]' 
              : 'text-yellow-400/90 drop-shadow-[0_0_35px_rgba(234,179,8,0.25)]'
          } ${pulse && isHighMode ? (isFJU ? 'animate-pulse' : 'opacity-95') : ''}`} strokeWidth={1.35} />
        </div>

        <h1 className={`font-sans font-black text-[6.5rem] xl:text-[8rem] 2xl:text-[9rem] tracking-tight ${
          isFJU ? 'text-white drop-shadow-[0_12px_40px_rgba(245,158,11,0.35)]' : 'text-white drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
        } leading-[1.03] mb-8`}>
          {meeting.theme}
        </h1>

        <div className={`inline-flex items-center gap-5 px-10 py-4 rounded-full ${
          isLightMode ? 'bg-zinc-950 border-2 border-zinc-800' : 'bg-zinc-950/80 border border-amber-500/25 backdrop-blur-md'
        }`}>
          <p className="text-[2.6rem] xl:text-[3.2rem] text-stone-100 font-bold font-mono tracking-wide">
            {formattedDate} — Às <span className={isFJU ? 'text-amber-400' : 'text-yellow-400'}>{meeting.time}</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

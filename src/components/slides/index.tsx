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
    title?.toLowerCase().includes("celular") || title?.toLowerCase().includes("foco") ? "ORIENTAÇÃO" :
    title?.toLowerCase().includes("assento") || title?.toLowerCase().includes("lugar") || title?.toLowerCase().includes("cola") ? "BEM-VINDO" :
    title?.toLowerCase().includes("banheiro") || title?.toLowerCase().includes("pit stop") ? "AVISO" :
    title?.toLowerCase().includes("instagram") || title?.toLowerCase().includes("story") ? "REDES SOCIAIS" :
    title?.toLowerCase().includes("silêncio") || title?.toLowerCase().includes("atenção") ? "CONCENTRAÇÃO" :
    "RECOMENDAÇÃO"
  );

  const containerVariants: any = isLightMode
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.15 } }
      }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: isHighMode ? 0.12 : 0.08, delayChildren: 0.1 }
        }
      };

  const itemVariants: any = isLightMode
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1 }
      }
    : {
        hidden: { opacity: 0, y: 20, scale: 0.97 },
        show: { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          transition: { duration: 0.55, ease: "easeOut" } 
        }
      };

  if (layout === 'split-left') {
    return (
      <div className="flex items-center justify-center h-full w-full px-12 xl:px-20 relative select-none">
        {!isLightMode && (
          <div className={`absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 ${isHighMode ? 'w-[700px] h-[700px] blur-[140px]' : 'w-[400px] h-[400px] blur-[70px]'} ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/10'} rounded-full pointer-events-none`} />
        )}

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="flex items-center justify-between w-full max-w-[96%] relative z-10"
        >
          {/* Left Text Block */}
          <div className="flex-1 text-left pr-12 xl:pr-20">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full mb-6 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${isFJU ? 'bg-amber-400' : 'bg-yellow-400'} ${isHighMode ? 'animate-ping' : ''}`} />
              <span className={`text-base xl:text-lg font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-amber-400' : 'text-yellow-400'}`}>
                {badgeLabel}
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants} 
              className={`font-sans font-black text-[5.8rem] xl:text-[7.2rem] tracking-tight leading-[1.05] mb-6 text-white ${
                isLightMode ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : 'drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]'
              }`}
            >
              {title}
            </motion.h1>

            <motion.p 
              variants={itemVariants} 
              className="text-[2.8rem] xl:text-[3.4rem] text-stone-200 font-normal leading-snug max-w-[92%]"
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Right Icon Podium */}
          <motion.div 
            variants={itemVariants} 
            className="flex-shrink-0 relative"
          >
            <div className={`p-14 xl:p-18 rounded-[3.5rem] ${
              isLightMode 
                ? 'bg-zinc-950 border border-zinc-800' 
                : 'bg-black/60 backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.7)]'
            } flex items-center justify-center relative overflow-hidden group`}>
              {!isLightMode && (
                <div className={`absolute inset-0 bg-gradient-to-br ${isFJU ? 'from-amber-500/15 via-transparent to-transparent' : 'from-yellow-500/15 via-transparent to-transparent'} pointer-events-none`} />
              )}
              <Icon 
                className={`w-[260px] h-[260px] xl:w-[320px] xl:h-[320px] ${
                  isFJU ? 'text-amber-400 drop-shadow-[0_0_50px_rgba(245,158,11,0.4)]' : 'text-yellow-400 drop-shadow-[0_0_50px_rgba(234,179,8,0.3)]'
                } ${pulse && isHighMode ? 'animate-pulse' : ''}`} 
                strokeWidth={1.2} 
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
          <div className={`absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 ${isHighMode ? 'w-[700px] h-[700px] blur-[140px]' : 'w-[400px] h-[400px] blur-[70px]'} ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/10'} rounded-full pointer-events-none`} />
        )}

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="flex items-center justify-between w-full max-w-[96%] relative z-10"
        >
          {/* Left Icon Podium */}
          <motion.div 
            variants={itemVariants} 
            className="flex-shrink-0 relative"
          >
            <div className={`p-14 xl:p-18 rounded-[3.5rem] ${
              isLightMode 
                ? 'bg-zinc-950 border border-zinc-800' 
                : 'bg-black/60 backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.7)]'
            } flex items-center justify-center relative overflow-hidden group`}>
              {!isLightMode && (
                <div className={`absolute inset-0 bg-gradient-to-br ${isFJU ? 'from-amber-500/15 via-transparent to-transparent' : 'from-yellow-500/15 via-transparent to-transparent'} pointer-events-none`} />
              )}
              <Icon 
                className={`w-[260px] h-[260px] xl:w-[320px] xl:h-[320px] ${
                  isFJU ? 'text-amber-400 drop-shadow-[0_0_50px_rgba(245,158,11,0.4)]' : 'text-yellow-400 drop-shadow-[0_0_50px_rgba(234,179,8,0.3)]'
                } ${pulse && isHighMode ? 'animate-pulse' : ''}`} 
                strokeWidth={1.2} 
              />
            </div>
          </motion.div>

          {/* Right Text Block */}
          <div className="flex-1 text-right pl-12 xl:pl-20">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full mb-6 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${isFJU ? 'bg-amber-400' : 'bg-yellow-400'} ${isHighMode ? 'animate-ping' : ''}`} />
              <span className={`text-base xl:text-lg font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-amber-400' : 'text-yellow-400'}`}>
                {badgeLabel}
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants} 
              className={`font-sans font-black text-[5.8rem] xl:text-[7.2rem] tracking-tight leading-[1.05] mb-6 text-white ${
                isLightMode ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : 'drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]'
              }`}
            >
              {title}
            </motion.h1>

            <motion.p 
              variants={itemVariants} 
              className="text-[2.8rem] xl:text-[3.4rem] text-stone-200 font-normal leading-snug max-w-[92%] ml-auto"
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
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isHighMode ? 'w-[750px] h-[750px] blur-[150px]' : 'w-[420px] h-[420px] blur-[70px]'} ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/10'} rounded-full pointer-events-none`} />
      )}

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="flex flex-col items-center justify-center text-center max-w-[92%] xl:max-w-[85%] relative z-10"
      >
        {/* Category Pill */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full mb-8 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
          <span className={`w-2 h-2 rounded-full ${isFJU ? 'bg-amber-400' : 'bg-yellow-400'} ${isHighMode ? 'animate-ping' : ''}`} />
          <span className={`text-base xl:text-lg font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-amber-400' : 'text-yellow-400'}`}>
            {badgeLabel}
          </span>
        </motion.div>

        {/* Center Icon */}
        <motion.div 
          variants={itemVariants}
          className="mb-8"
        >
          <div className={`p-8 xl:p-10 rounded-[2.5rem] ${
            isLightMode 
              ? 'bg-zinc-950 border border-zinc-800' 
              : 'bg-black/60 backdrop-blur-md border border-white/[0.1] shadow-2xl'
          } inline-flex items-center justify-center`}>
            <Icon 
              className={`w-36 h-36 xl:w-44 xl:h-44 ${
                isFJU ? 'text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]' : 'text-yellow-400 drop-shadow-[0_0_40px_rgba(234,179,8,0.3)]'
              } ${pulse && isHighMode ? 'animate-pulse' : ''}`} 
              strokeWidth={1.3} 
            />
          </div>
        </motion.div>

        <motion.h1 
          variants={itemVariants} 
          className={`font-sans font-black text-[5.8rem] xl:text-[7.2rem] tracking-tight leading-[1.05] mb-6 text-white uppercase ${
            isLightMode ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : 'drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]'
          }`}
        >
          {title}
        </motion.h1>

        <motion.p 
          variants={itemVariants} 
          className={`text-[2.8rem] xl:text-[3.5rem] ${isFJU ? 'text-stone-100' : 'text-stone-200'} font-medium leading-snug max-w-[94%]`}
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
    <div className="flex flex-col items-center justify-center text-center max-w-5xl h-full w-full relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isHighMode ? 'w-[800px] h-[800px] blur-[160px]' : 'w-[450px] h-[450px] blur-[70px]'} ${phase === 'god' ? (isFJU ? 'bg-amber-600/15' : 'bg-yellow-500/15') : 'bg-blue-600/10'} rounded-full pointer-events-none transition-colors duration-1000`} />
      )}

      <AnimatePresence mode="wait">
        {phase === 'world' ? (
          <motion.div 
            key="world"
            initial={{ opacity: 0, scale: isLightMode ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isLightMode ? 1 : 1.04 }}
            transition={{ duration: isLightMode ? 0.2 : 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center relative z-10"
          >
            <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full mb-8 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-base font-black tracking-[0.25em] uppercase font-mono text-cyan-400">
                MOMENTO DE TRANSIÇÃO
              </span>
            </div>

            <div className={`p-8 rounded-[2.5rem] ${isLightMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-black/60 backdrop-blur-md border border-white/[0.1]'} mb-8`}>
              <Globe className={`w-36 h-36 ${isFJU ? 'text-amber-400/70' : 'text-cyan-400/70'} ${!isLightMode ? 'animate-[spin_25s_linear_infinite]' : ''}`} strokeWidth={1.2} />
            </div>

            <h1 className="font-sans font-black text-[5.5rem] xl:text-[6.8rem] tracking-tight text-white leading-none uppercase drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
              {isFJU ? 'Cola com a gente' : 'Desligue-se do mundo'}
            </h1>
            <p className="text-stone-300 text-3xl font-medium mt-4 tracking-wide">
              Prepare sua mente e seu coração
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="god"
            initial={{ opacity: 0, scale: isLightMode ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isLightMode ? 1 : 1.04 }}
            transition={{ duration: isLightMode ? 0.2 : 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center relative z-10"
          >
            <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full mb-8 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${isFJU ? 'bg-amber-400' : 'bg-yellow-400'} animate-ping`} />
              <span className={`text-base font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-amber-400' : 'text-yellow-400'}`}>
                PRESENÇA DE DEUS
              </span>
            </div>

            <div className={`p-8 rounded-[2.5rem] ${isLightMode ? 'bg-zinc-950 border border-amber-500/40' : 'bg-black/60 backdrop-blur-md border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.2)]'} mb-8`}>
              <Flame className={`w-36 h-36 ${isFJU ? 'text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.6)]' : 'text-yellow-400 drop-shadow-[0_0_40px_rgba(234,179,8,0.5)]'}`} strokeWidth={1.4} />
            </div>

            <h1 className={`font-sans font-black text-[5.5rem] xl:text-[6.8rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_0_50px_rgba(245,158,11,0.4)]' : 'text-yellow-400 drop-shadow-[0_0_45px_rgba(234,179,8,0.35)]'} leading-none uppercase`}>
              {isFJU ? 'Vem pra FJU' : 'Ligue-se com Deus'}
            </h1>
            <p className="text-amber-200/90 text-3xl font-medium mt-4 tracking-wide">
              Uma reunião que vai transformar a sua vida
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
        show: { opacity: 1, transition: { duration: 0.15 } }
      }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.08, delayChildren: 0.1 }
        }
      };
  
  const itemVariants: any = isLightMode
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1 }
      }
    : {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
      };

  return (
    <div className="flex items-center justify-center h-full w-full px-12 xl:px-20 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 ${isHighMode ? 'w-[700px] h-[700px] blur-[140px]' : 'w-[400px] h-[400px] blur-[70px]'} ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/10'} rounded-full pointer-events-none`} />
      )}

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="flex items-center justify-between max-w-[96%] w-full relative z-10"
      >
        {/* Left Column: Day & Theme */}
        <div className={`flex-1 text-left pr-14 xl:pr-20 border-r ${isFJU ? 'border-amber-500/30' : 'border-white/10'}`}>
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full mb-6 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
            <span className={`w-2.5 h-2.5 rounded-full ${isToday ? 'bg-emerald-400 animate-ping' : (isFJU ? 'bg-amber-400' : 'bg-yellow-400')}`} />
            <span className={`text-base xl:text-lg font-black tracking-[0.25em] uppercase font-mono ${isToday ? 'text-emerald-400' : (isFJU ? 'text-amber-400' : 'text-yellow-400')}`}>
              {isToday ? 'REUNIÕES DE HOJE' : 'AGENDA DA SEMANA'}
            </span>
          </motion.div>

          <motion.h3 variants={itemVariants} className="text-stone-300 font-extrabold uppercase tracking-[0.25em] mb-4 text-[2.2rem] xl:text-[2.6rem]">
            {defaultSchedule.dayName}
          </motion.h3>

          <motion.h2 variants={itemVariants} className={`text-[5.4rem] xl:text-[6.8rem] ${isFJU ? 'text-white drop-shadow-[0_10px_35px_rgba(245,158,11,0.3)]' : 'text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]'} font-black uppercase tracking-tight leading-[1.05] whitespace-pre-line`}>
            {theme}
          </motion.h2>
        </div>

        {/* Right Column: Time Cards Grid */}
        <div className="flex-1 pl-14 xl:pl-20">
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
            {formattedTimes.length > 0 ? (
              formattedTimes.map((t, i) => (
                <div 
                  key={i} 
                  className={`px-8 py-7 rounded-3xl border flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                    t.isSpecial 
                      ? (isFJU 
                          ? "bg-amber-600/15 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]" 
                          : "bg-yellow-500/15 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]")
                      : (isLightMode 
                          ? "bg-zinc-950 border-zinc-800" 
                          : "bg-black/60 backdrop-blur-md border-white/[0.1] shadow-xl")
                  }`}
                >
                  <span className={`font-mono text-[3.6rem] xl:text-[4.2rem] font-black tracking-wider relative z-10 ${
                    t.isSpecial 
                      ? (isFJU ? "text-amber-400" : "text-yellow-400") 
                      : "text-white"
                  }`}>
                    {t.time}
                  </span>

                  {t.isSpecial ? (
                    <span className={`mt-2 text-xs px-3 py-1 rounded-full font-black uppercase tracking-widest ${isFJU ? 'bg-amber-500 text-black' : 'bg-yellow-500 text-black'}`}>
                      Especial
                    </span>
                  ) : (
                    <span className="mt-2 text-xs text-stone-400 uppercase tracking-widest font-bold font-mono">
                      Horário
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 bg-black/40 border border-white/[0.08] rounded-3xl">
                <span className="text-stone-300 text-2xl font-medium">Sem reuniões programadas para este dia.</span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
 
// ==========================================
// DONATION / TITHES & OFFERINGS SLIDE
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
        <div className={`absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 ${isHighMode ? 'w-[750px] h-[750px] blur-[150px]' : 'w-[400px] h-[400px] blur-[70px]'} ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/10'} rounded-full pointer-events-none`} />
      )}

      <motion.div
        initial={{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isLightMode ? 0.2 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between w-full max-w-[96%] relative z-10"
      >
        <div className="flex-1 text-left pr-14 xl:pr-20">
          <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full mb-6 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
            <HeartHandshake className={`w-6 h-6 ${isFJU ? 'text-amber-400' : 'text-yellow-400'}`} strokeWidth={1.5} />
            <span className={`text-base xl:text-lg font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-amber-400' : 'text-yellow-400'}`}>
              DÍZIMOS E OFERTAS
            </span>
          </div>

          <h1 className={`font-sans font-black text-[5.8rem] xl:text-[7.2rem] tracking-tight leading-[1.05] mb-6 text-white ${
            isLightMode ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : 'drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]'
          }`}>
            Contribua com a <br /><span className={isFJU ? 'text-amber-400' : 'text-yellow-400'}>Obra de Deus</span>
          </h1>

          <p className="text-[2.6rem] xl:text-[3.2rem] text-stone-200 font-normal leading-snug max-w-[92%] mb-8">
            Aponte a câmera do seu celular para o QR Code ao lado ou acesse <span className={`${isFJU ? 'text-amber-400 font-bold' : 'text-yellow-400 font-bold'}`}>{DONATION.url.replace(/^https?:\/\//, '')}</span>
          </p>

          <div className={`p-6 rounded-2xl inline-flex items-center gap-4 ${isLightMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-black/60 border border-white/[0.1] backdrop-blur-md'}`}>
            <Info className={`w-8 h-8 ${isFJU ? 'text-amber-400' : 'text-yellow-400'} shrink-0`} />
            <div>
              <p className="text-stone-200 text-2xl font-bold">Lembre-se de enviar o comprovante</p>
              <p className="text-stone-400 text-lg mt-0.5">O contato de WhatsApp está disponível na página de doações.</p>
            </div>
          </div>
        </div>

        {/* QR Code Container with Glowing Frame */}
        <div className={`flex-shrink-0 p-8 rounded-[3rem] ${
          isLightMode 
            ? 'bg-white border-8 border-zinc-800' 
            : 'bg-white shadow-[0_20px_60px_rgba(0,0,0,0.8)] ring-8 ring-amber-500/30'
        }`}>
          <QRCode value={DONATION.url} size={420} />
          <div className="mt-4 text-center">
            <span className="text-zinc-900 font-mono font-black text-sm uppercase tracking-widest">
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
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isHighMode ? 'w-[800px] h-[800px] blur-[160px]' : 'w-[450px] h-[450px] blur-[70px]'} bg-amber-600/10 rounded-full pointer-events-none`} />
      )}

      <motion.div
        initial={{ opacity: 0, y: isLightMode ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: isLightMode ? 0.2 : 0.6 }}
        className="w-full flex flex-col items-center justify-center relative z-10"
      >
        <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full mb-8 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
          <Flame className="w-6 h-6 text-amber-400" />
          <span className="text-base xl:text-lg font-black tracking-[0.25em] uppercase font-mono text-amber-400">
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
                  <div key={index} className={`p-14 xl:p-18 rounded-[3.5rem] flex items-center justify-between gap-16 w-full max-w-5xl relative overflow-hidden ${
                    isLightMode ? 'bg-zinc-950 border border-amber-500/30' : 'bg-black/60 backdrop-blur-xl border border-amber-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
                  }`}>
                    <div className="flex-1 text-left">
                      <span className="text-amber-400 text-lg uppercase tracking-[0.25em] font-extrabold block mb-4">
                        EM ANDAMENTO
                      </span>
                      <h3 className="text-white font-black text-[4.8rem] xl:text-[5.5rem] leading-[1.05] tracking-tight mb-8 whitespace-pre-line">
                        {campaign.title}
                      </h3>
                      <div className="inline-flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 px-6 py-3 rounded-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-amber-400 text-xl uppercase tracking-wider font-black font-mono">
                          {campaign.duration}
                        </span>
                      </div>
                    </div>

                    <div className={`p-10 rounded-[2.5rem] ${isLightMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-amber-500/10 border border-amber-500/30 shadow-inner'} flex-shrink-0`}>
                      <Icon className="w-36 h-36 text-amber-400" strokeWidth={1.2} />
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={`p-10 rounded-[2.5rem] flex flex-col items-center text-center relative overflow-hidden ${
                  isLightMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-black/60 backdrop-blur-md border border-white/[0.1] shadow-xl'
                }`}>
                  <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
                    <Icon className="w-20 h-20 text-amber-400" strokeWidth={1.2} />
                  </div>
                  
                  <h3 className="text-white font-black text-[3rem] leading-tight mb-4 tracking-tight whitespace-pre-line">
                    {campaign.title}
                  </h3>
                  
                  <div className="mt-auto bg-amber-500/10 border border-amber-500/30 px-5 py-2 rounded-full">
                    <p className="text-amber-400 text-base uppercase tracking-[0.15em] font-black font-mono">
                      {campaign.duration}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`w-full max-w-4xl p-14 rounded-[3rem] flex flex-col items-center text-center mx-auto ${
              isLightMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-black/60 backdrop-blur-md border border-white/[0.1]'
            }`}>
              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
                <Flame className="w-16 h-16 text-amber-400" strokeWidth={1.2} />
              </div>
              <h3 className="text-white font-extrabold text-[2.8rem] tracking-tight mb-3">Ainda Não Há Propósitos em Andamento</h3>
              <p className="text-stone-300 text-2xl leading-relaxed max-w-2xl font-medium">
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
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isHighMode ? 'w-[750px] h-[750px] blur-[150px]' : 'w-[400px] h-[400px] blur-[70px]'} ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/10'} rounded-full pointer-events-none`} />
      )}

      <motion.div 
        initial={{ opacity: 0, scale: isLightMode ? 1 : 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isLightMode ? 0.2 : 0.6 }}
        className="flex flex-col items-center justify-center text-center max-w-[88%] relative z-10"
      >
        <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full mb-8 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
          <span className={`w-2 h-2 rounded-full ${isFJU ? 'bg-amber-400' : 'bg-yellow-400'} animate-ping`} />
          <span className={`text-base xl:text-lg font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-amber-400' : 'text-yellow-400'}`}>
            EVENTO ESPECIAL
          </span>
        </div>

        <div className={`p-8 rounded-[2.5rem] ${isLightMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-black/60 backdrop-blur-md border border-white/[0.1] shadow-2xl'} mb-8`}>
          <Icon className={`w-32 h-32 ${isFJU ? 'text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]' : 'text-yellow-400 drop-shadow-[0_0_40px_rgba(234,179,8,0.3)]'} ${pulse && isHighMode ? 'animate-pulse' : ''}`} strokeWidth={1.3} />
        </div>

        <h1 className={`font-sans font-black text-[5.5rem] xl:text-[7rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_10px_35px_rgba(245,158,11,0.3)]' : 'text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]'} leading-none mb-6`}>
          {meeting.theme}
        </h1>

        <div className={`inline-flex items-center gap-4 px-8 py-3.5 rounded-full ${isLightMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-black/60 border border-white/[0.1] backdrop-blur-md'}`}>
          <p className="text-[2.2rem] xl:text-[2.6rem] text-stone-100 font-bold font-mono tracking-wide">
            {formattedDate} — Às <span className={isFJU ? 'text-amber-400' : 'text-yellow-400'}>{meeting.time}</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

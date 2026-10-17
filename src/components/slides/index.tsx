import {FjuSlide} from '../FjuSlide';
import {symbolMotion} from '../../utils/projection-motion';
import {ProjectionFire} from '../ProjectionFire';
import {ProjectionGlobe} from '../ProjectionGlobe';
import {Globe,Flame,HeartHandshake,CalendarDays,WifiOff,Info,Droplets,PrayingHands,BookOpen} from '../ui/icons';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
  const reducedMotion=useReducedMotion();
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
      <div className="flex items-center justify-center h-full w-full px-14 @[1280px]:px-24 relative select-none">
        {!isLightMode && (
          <div className={`absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 ${
            isHighMode ? 'w-[750px] h-[750px] blur-[150px]' : 'w-[420px] h-[420px] blur-[70px]'
          } ${isFJU ? 'bg-hl-gold-strong/10' : 'bg-hl-gold/08'} rounded-full pointer-events-none`} />
        )}

        <motion.div
          variants={containerVariants}
          initial={reducedMotion?false:"hidden"}
          animate="show"
          className="flex items-center justify-between w-full max-w-[96%] relative z-10 gap-12 @[1280px]:gap-16"
        >
          {/* Left Text Block */}
          <div className="flex-[1.4] text-left pr-6">
            <motion.div
              variants={itemVariants}
              className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-6 ${
                isFJU
                  ? 'bg-hl-gold/10 border border-hl-gold/30'
                  : 'bg-white/[0.04] border border-hl-gold/25'
              } backdrop-blur-md`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                isFJU ? 'bg-hl-gold-bright animate-ping' : 'bg-hl-gold-bright/90'
              }`} />
              <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
                isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'
              }`}>
                {badgeLabel}
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className={`font-sans font-black text-[4.4rem] @[1280px]:text-[5.2rem] @[1536px]:text-[6rem] tracking-tight leading-[1.08] mb-5 text-white ${
                isLightMode ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' : 'drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
              }`}
            >
              {title}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className={`text-[2.2rem] @[1280px]:text-[2.6rem] @[1536px]:text-[3rem] ${
                isFJU ? 'text-hl-copy font-medium' : 'text-hl-soft font-normal'
              } leading-[1.28] max-w-[92%]`}
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Right Icon Podium */}
          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 relative"
          >
            <div className={`projection-emblem p-10 @[1280px]:p-14 ${
              isFJU ? 'rounded-[3.5rem]' : 'rounded-3xl'
            } ${
              isLightMode
                ? 'bg-hl-canvas border-2 border-hl-line'
                : isFJU
                  ? 'bg-black/60 backdrop-blur-xl border border-hl-gold/30 shadow-[0_25px_70px_rgba(0,0,0,0.75)]'
                  : 'bg-hl-canvas/80 backdrop-blur-xl border border-hl-gold/25 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            } flex items-center justify-center relative overflow-hidden group`}>
              {!isLightMode && (
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  isFJU ? 'from-hl-gold/20 via-transparent to-transparent' : 'from-hl-gold/10 via-transparent to-transparent'
                } pointer-events-none`} />
              )}
              <Icon
                className={`w-[180px] h-[180px] @[1280px]:w-[220px] @[1280px]:h-[220px] ${
                  isFJU
                    ? 'text-hl-gold-bright drop-shadow-[0_0_55px_rgba(255,211,79,0.45)]'
                    : 'text-hl-gold-bright/90 drop-shadow-[0_0_35px_rgba(255,211,79,0.25)]'
                } ${pulse && isHighMode ? (isFJU ? 'animate-pulse' : 'opacity-95') : ''}`}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (layout === 'split-right') {
    return (
      <div className="flex items-center justify-center h-full w-full px-14 @[1280px]:px-24 relative select-none">
        {!isLightMode && (
          <div className={`absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 ${
            isHighMode ? 'w-[750px] h-[750px] blur-[150px]' : 'w-[420px] h-[420px] blur-[70px]'
          } ${isFJU ? 'bg-hl-gold-strong/10' : 'bg-hl-gold/08'} rounded-full pointer-events-none`} />
        )}

        <motion.div
          variants={containerVariants}
          initial={reducedMotion?false:"hidden"}
          animate="show"
          className="flex items-center justify-between w-full max-w-[96%] relative z-10 gap-12 @[1280px]:gap-16"
        >
          {/* Left Icon Podium */}
          <motion.div
            variants={itemVariants}
            className="flex-shrink-0 relative"
          >
            <div className={`projection-emblem p-10 @[1280px]:p-14 ${
              isFJU ? 'rounded-[3.5rem]' : 'rounded-3xl'
            } ${
              isLightMode
                ? 'bg-hl-canvas border-2 border-hl-line'
                : isFJU
                  ? 'bg-black/60 backdrop-blur-xl border border-hl-gold/30 shadow-[0_25px_70px_rgba(0,0,0,0.75)]'
                  : 'bg-hl-canvas/80 backdrop-blur-xl border border-hl-gold/25 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            } flex items-center justify-center relative overflow-hidden group`}>
              {!isLightMode && (
                <div className={`absolute inset-0 bg-gradient-to-br ${
                  isFJU ? 'from-hl-gold/20 via-transparent to-transparent' : 'from-hl-gold/10 via-transparent to-transparent'
                } pointer-events-none`} />
              )}
              <Icon
                className={`w-[180px] h-[180px] @[1280px]:w-[220px] @[1280px]:h-[220px] ${
                  isFJU
                    ? 'text-hl-gold-bright drop-shadow-[0_0_55px_rgba(255,211,79,0.45)]'
                    : 'text-hl-gold-bright/90 drop-shadow-[0_0_35px_rgba(255,211,79,0.25)]'
                } ${pulse && isHighMode ? (isFJU ? 'animate-pulse' : 'opacity-95') : ''}`}
              />
            </div>
          </motion.div>

          {/* Right Text Block */}
          <div className="flex-[1.4] text-right pl-6">
            <motion.div
              variants={itemVariants}
              className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-6 ${
                isFJU
                  ? 'bg-hl-gold/10 border border-hl-gold/30'
                  : 'bg-white/[0.04] border border-hl-gold/25'
              } backdrop-blur-md`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                isFJU ? 'bg-hl-gold-bright animate-ping' : 'bg-hl-gold-bright/90'
              }`} />
              <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
                isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'
              }`}>
                {badgeLabel}
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className={`font-sans font-black text-[4.4rem] @[1280px]:text-[5.2rem] @[1536px]:text-[6rem] tracking-tight leading-[1.08] mb-5 text-white ${
                isLightMode ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' : 'drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
              }`}
            >
              {title}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className={`text-[2.2rem] @[1280px]:text-[2.6rem] @[1536px]:text-[3rem] ${
                isFJU ? 'text-hl-copy font-medium' : 'text-hl-soft font-normal'
              } leading-[1.28] max-w-[92%] ml-auto`}
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
    <div className="flex items-center justify-center h-full w-full px-12 @[1280px]:px-24 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[800px] h-[800px] blur-[160px]' : 'w-[450px] h-[450px] blur-[70px]'
        } ${isFJU ? 'bg-hl-gold-strong/10' : 'bg-hl-gold/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div
        variants={containerVariants}
        initial={reducedMotion?false:"hidden"}
        animate="show"
        className="flex flex-col items-center justify-center text-center max-w-[92%] relative z-10"
      >
        {/* Category Pill */}
        <motion.div
          variants={itemVariants}
          className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-6 ${
            isFJU
              ? 'bg-hl-gold/10 border border-hl-gold/30'
              : 'bg-white/[0.04] border border-hl-gold/25'
          } backdrop-blur-md`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${
            isFJU ? 'bg-hl-gold-bright animate-ping' : 'bg-hl-gold-bright/90'
          }`} />
          <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
            isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'
          }`}>
            {badgeLabel}
          </span>
        </motion.div>

        {/* Center Icon */}
        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <div className={`projection-emblem p-8 @[1280px]:p-10 ${
            isFJU ? 'rounded-[3rem]' : 'rounded-3xl'
          } ${
            isLightMode
              ? 'bg-hl-canvas border-2 border-hl-line'
              : isFJU
                ? 'bg-black/60 backdrop-blur-md border border-hl-gold/30 shadow-2xl'
                : 'bg-hl-canvas/80 backdrop-blur-md border border-hl-gold/25 shadow-2xl'
          } inline-flex items-center justify-center`}>
            <Icon
              className={`w-32 h-32 @[1280px]:w-40 @[1280px]:h-40 ${
                isFJU
                  ? 'text-hl-gold-bright drop-shadow-[0_0_45px_rgba(255,211,79,0.45)]'
                  : 'text-hl-gold-bright/90 drop-shadow-[0_0_30px_rgba(255,211,79,0.25)]'
              } ${pulse && isHighMode ? (isFJU ? 'animate-pulse' : 'opacity-95') : ''}`}
            />
          </div>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className={`font-sans font-black text-[4.4rem] @[1280px]:text-[5.4rem] @[1536px]:text-[6.2rem] tracking-tight leading-[1.08] mb-5 text-white uppercase ${
            isLightMode ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' : 'drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
          }`}
        >
          {title}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className={`text-[2.2rem] @[1280px]:text-[2.6rem] @[1536px]:text-[3rem] ${
            isFJU ? 'text-hl-copy font-medium' : 'text-hl-soft font-normal'
          } leading-[1.28] max-w-[88%]`}
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
export const WorldGodSlide = ({ variant, backgroundStyle='auto',fps=30,detail='medium',effectiveMode: propEffectiveMode, isLightModeActive: propIsLightMode }: any) => {
  const reducedMotion=useReducedMotion();
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';

  const symbolSettings=symbolMotion(backgroundStyle,isLightMode?'light':effectiveMode,fps,detail);
  const [phase, setPhase] = useState<'world' | 'god'>('world');
  const isFJU = variant === 'fju';

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('god');
    }, 7500);
    return () => clearTimeout(t);
  }, []);

  if(isFJU)return <FjuSlide title={phase==='world'?'Deixe as distrações':'Conecte-se com Deus'} subtitle={phase==='world'?'Concentre-se no que acontece aqui.':'Use a sua fé.'} symbol={phase==='world'?<ProjectionGlobe {...symbolSettings} youth/>:<ProjectionFire {...symbolSettings} youth/>}/>;

  return (
    <div className="flex flex-col items-center justify-center text-center max-w-6xl h-full w-full relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[850px] h-[850px] blur-[170px]' : 'w-[480px] h-[480px] blur-[75px]'
        } ${phase === 'god' ? (isFJU ? 'bg-hl-gold-strong/15' : 'bg-hl-gold/10') : (isFJU ? 'bg-hl-gold-strong/10' : 'bg-hl-line/08')} rounded-full pointer-events-none transition-colors duration-1000`} />
      )}

      <AnimatePresence mode="wait">
        {phase === 'world' ? (
          <motion.div
            key="world"
            initial={reducedMotion?false:{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isLightMode ? 1 : 1.02 }}
            transition={{ duration: isLightMode ? 0.35 : 0.7, ease: isLightMode ? "easeInOut" : [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center relative z-10 max-w-[92%]"
          >
            <div className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-6 ${
              isFJU
                ? 'bg-hl-gold/10 border border-hl-gold/30'
                : 'bg-white/[0.04] border border-hl-line-strong/30'
            } backdrop-blur-md`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-hl-gold-bright animate-pulse' : 'bg-hl-copy/80'}`} />
              <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-hl-gold-bright' : 'text-hl-soft'}`}>
                {isFJU ? 'FORÇA JOVEM UNIVERSAL' : 'PREPARAÇÃO'}
              </span>
            </div>

            <div className={`projection-world-emblem ${isFJU ? 'rounded-[3rem]' : 'rounded-3xl'} ${
              isLightMode
                ? 'bg-hl-canvas border-2 border-hl-line'
                : 'bg-hl-panel/70 backdrop-blur-md border border-hl-line/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
            } mb-6`}>
              <ProjectionGlobe {...symbolSettings}/>
            </div>

            <h1 className="font-sans font-black text-[4.4rem] @[1280px]:text-[5.4rem] @[1536px]:text-[6.2rem] tracking-tight text-white leading-[1.08] mb-4 uppercase drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
              {isFJU ? 'Cola com a gente' : 'Desligue-se do mundo'}
            </h1>
            <p className="text-hl-soft text-[2.2rem] @[1280px]:text-[2.6rem] @[1536px]:text-[3rem] font-normal tracking-wide leading-[1.28] max-w-[88%]">
              Deixe as preocupações de lado e concentre-se em Deus.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="god"
            initial={reducedMotion?false:{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isLightMode ? 1 : 1.02 }}
            transition={{ duration: isLightMode ? 0.35 : 0.85, ease: isLightMode ? "easeInOut" : [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center relative z-10 max-w-[92%]"
          >
            <div className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-6 ${
              isFJU ? 'bg-hl-gold/10 border border-hl-gold/30' : 'bg-white/[0.04] border border-hl-gold/25'
            } backdrop-blur-md`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-hl-gold-bright animate-ping' : 'bg-hl-gold-bright/90'}`} />
              <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'}`}>
                PRESENÇA DE DEUS
              </span>
            </div>

            <div className="projection-world-emblem mb-6"><ProjectionFire {...symbolSettings}/></div>

            <h1 className={`font-sans font-black text-[4.4rem] @[1280px]:text-[5.4rem] @[1536px]:text-[6.2rem] tracking-tight ${isFJU ? 'text-white drop-shadow-[0_0_60px_rgba(255,211,79,0.45)]' : 'text-hl-gold-bright drop-shadow-[0_0_50px_rgba(255,211,79,0.35)]'} leading-[1.08] mb-4 uppercase`}>
              {isFJU ? 'Vem pra FJU' : 'Ligue-se com Deus'}
            </h1>
            <p className="text-hl-gold-bright/90 text-[2.2rem] @[1280px]:text-[2.6rem] @[1536px]:text-[3rem] font-normal tracking-wide leading-[1.28] max-w-[88%]">
              Use a sua fé e acompanhe a reunião.
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
  const reducedMotion=useReducedMotion();
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
    <div className="flex items-center justify-center h-full w-full px-14 @[1280px]:px-24 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[750px] h-[750px] blur-[150px]' : 'w-[420px] h-[420px] blur-[70px]'
        } ${isFJU ? 'bg-hl-gold-strong/10' : 'bg-hl-gold/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div
        variants={containerVariants}
        initial={reducedMotion?false:"hidden"}
        animate="show"
        className="flex items-center justify-between max-w-[96%] w-full relative z-10 gap-12 @[1280px]:gap-16"
      >
        {/* Left Column: Day & Theme */}
        <div className={`flex-[1.1] text-left pr-10 @[1280px]:pr-14 border-r ${isFJU ? 'border-hl-gold/30' : 'border-hl-gold/20'}`}>
          <motion.div variants={itemVariants} className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-5 ${
            isToday || isFJU
              ? 'bg-hl-gold/10 border border-hl-gold/30'
              : 'bg-white/[0.04] border border-white/[0.12]'
          } backdrop-blur-md`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              isToday || isFJU ? (isFJU ? 'bg-hl-gold-bright animate-ping' : 'bg-hl-gold-bright') : 'bg-hl-gold-bright/80'
            }`} />
            <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
              isToday || isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright'
            }`}>
              {isToday ? 'REUNIÕES DE HOJE' : 'AGENDA DA SEMANA'}
            </span>
          </motion.div>

          <motion.h3 variants={itemVariants} className="text-hl-soft font-extrabold uppercase tracking-[0.2em] mb-3 text-[2.2rem] @[1280px]:text-[2.6rem]">
            {defaultSchedule.dayName}
          </motion.h3>

          <motion.h2 variants={itemVariants} className={`text-[4.2rem] @[1280px]:text-[5rem] @[1536px]:text-[5.8rem] ${
            isFJU ? 'text-white drop-shadow-[0_12px_40px_rgba(255,211,79,0.35)]' : 'text-white drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
          } font-black uppercase tracking-tight leading-[1.06] whitespace-pre-line`}>
            {theme}
          </motion.h2>
        </div>

        {/* Right Column: Time Cards Grid */}
        <div className="flex-1 pl-6">
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-5 @[1280px]:gap-6">
            {formattedTimes.length > 0 ? (
              formattedTimes.map((t, i) => (
                <div
                  key={i}
                  className={`px-6 py-6 @[1280px]:py-8 ${isFJU ? 'rounded-[2.2rem]' : 'rounded-2xl'} border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                    t.isSpecial
                      ? (isFJU
                          ? "bg-hl-gold-strong/20 border-hl-gold/60 shadow-[0_0_35px_rgba(255,211,79,0.25)]"
                          : "bg-hl-gold/20 border-hl-gold/50 shadow-[0_0_30px_rgba(255,211,79,0.2)]")
                      : (isLightMode
                          ? "bg-hl-canvas border-hl-line"
                          : isFJU
                            ? "bg-black/60 backdrop-blur-md border-white/[0.12] shadow-2xl"
                            : "bg-hl-canvas/80 backdrop-blur-md border-hl-gold/20 shadow-2xl")
                  }`}
                >
                  <span className={`font-mono text-[3.8rem] @[1280px]:text-[4.6rem] @[1536px]:text-[5.2rem] font-black tracking-wider leading-none relative z-10 ${
                    t.isSpecial
                      ? (isFJU ? "text-hl-gold-bright" : "text-hl-gold-bright")
                      : "text-white"
                  }`}>
                    {t.time}
                  </span>

                  {t.isSpecial && (
                    <span className={`mt-2 text-base font-black px-4 py-1 rounded-full uppercase tracking-widest ${
                      isFJU ? 'bg-hl-gold text-black' : 'bg-hl-gold text-black'
                    }`}>
                      Especial
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 bg-black/40 border border-white/[0.1] rounded-3xl">
                <span className="text-hl-soft text-2xl @[1280px]:text-3xl font-medium">Sem reuniões programadas para este dia.</span>
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
  const reducedMotion=useReducedMotion();
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';
  const isFJU = variant === 'fju';

  return (
    <div className="flex items-center justify-center h-full w-full px-14 @[1280px]:px-24 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[800px] h-[800px] blur-[160px]' : 'w-[450px] h-[450px] blur-[75px]'
        } ${isFJU ? 'bg-hl-gold-strong/10' : 'bg-hl-gold/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div
        initial={reducedMotion?false:{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isLightMode ? 0.35 : 0.6, ease: isLightMode ? "easeInOut" : [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between w-full max-w-[96%] relative z-10 gap-12 @[1280px]:gap-16"
      >
        <div className="flex-[1.3] text-left pr-6">
          <div className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-5 ${
            isFJU ? 'bg-hl-gold/10 border border-hl-gold/30' : 'bg-white/[0.04] border border-hl-gold/25'
          } backdrop-blur-md`}>
            <HeartHandshake className={`w-7 h-7 ${isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright'}`} />
            <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'}`}>
              DÍZIMOS E OFERTAS
            </span>
          </div>

          <h1 className={`font-sans font-black text-[4.4rem] @[1280px]:text-[5.2rem] @[1536px]:text-[6rem] tracking-tight leading-[1.08] mb-5 text-white ${
            isLightMode ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' : 'drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
          }`}>
            {isFJU ? (
              <>Faça sua <span className="text-hl-gold-bright">Doação</span></>
            ) : (
              <>Dízimos e <span className="text-hl-gold-bright">Ofertas</span></>
            )}
          </h1>

          <p className="text-[2.2rem] @[1280px]:text-[2.6rem] @[1536px]:text-[3rem] text-hl-soft font-normal leading-[1.28] max-w-[92%] mb-6">
            Apresente sua fidelidade e gratidão apontando a câmera para o QR Code ao lado ou acesse <span className={`${isFJU ? 'text-hl-gold-bright font-bold' : 'text-hl-gold-bright font-bold'}`}>{DONATION.url.replace(/^https?:\/\//, '')}</span>
          </p>

          <div className={`p-6 ${isFJU ? 'rounded-3xl' : 'rounded-2xl'} inline-flex items-center gap-5 ${
            isLightMode ? 'bg-hl-canvas border-2 border-hl-line' : 'bg-hl-canvas/80 border border-hl-gold/20 backdrop-blur-md'
          }`}>
            <Info className={`w-8 h-8 ${isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/90'} shrink-0`} />
            <div>
              <p className="text-hl-copy text-xl @[1280px]:text-2xl font-bold">Lembre-se de enviar o comprovante</p>
              <p className="text-hl-muted text-lg @[1280px]:text-xl mt-0.5">O contato de WhatsApp está disponível na página de doações.</p>
            </div>
          </div>
        </div>

        {/* QR Code Container with Frame */}
        <div data-projection-qr className="projection-qr-block"><div className={`projection-qr-plate flex-shrink-0 p-7 ${isFJU ? 'rounded-[3rem]' : 'rounded-3xl'} ${
          isLightMode
            ? 'bg-white border-8 border-hl-line'
            : isFJU
              ? 'bg-white shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-8 ring-hl-gold/30'
              : 'bg-white shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-4 ring-hl-gold/30'
        }`}>
          <QRCode value={DONATION.url} size={320} level="M" title="Doações — universal.org/doar"/>
          </div><div className="mt-3 text-center">
            <span className="text-hl-ink font-mono font-black text-base uppercase tracking-widest">
              UNIVERSAL.ORG/DOAR
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
  const reducedMotion=useReducedMotion();
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
    <div className="flex flex-col items-center justify-center w-full h-full px-14 @[1280px]:px-24 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[850px] h-[850px] blur-[170px]' : 'w-[480px] h-[480px] blur-[75px]'
        } bg-hl-gold-strong/08 rounded-full pointer-events-none`} />
      )}

      <motion.div
        initial={reducedMotion?false:{ opacity: 0, y: isLightMode ? 0 : 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: isLightMode ? 0.35 : 0.6, ease: isLightMode ? "easeInOut" : "easeOut" }}
        className="w-full flex flex-col items-center justify-center relative z-10"
      >
        <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full mb-6 bg-white/[0.04] border border-hl-gold/25 backdrop-blur-md">
          <Flame className="w-7 h-7 text-hl-gold-bright" />
          <span className="text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono text-hl-gold-bright/95">
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
                Icon = BookOpen;
              }

              if (activeCampaigns.length === 1) {
                return (
                  <div key={index} className={`p-12 @[1280px]:p-14 rounded-3xl flex items-center justify-between gap-12 w-full max-w-5xl relative overflow-hidden ${
                    isLightMode ? 'bg-hl-canvas border-2 border-hl-gold/30' : 'bg-hl-canvas/80 backdrop-blur-xl border border-hl-gold/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
                  }`}>
                    <div className="flex-1 text-left">
                      <span className="text-hl-gold-bright text-xl @[1280px]:text-2xl uppercase tracking-[0.25em] font-extrabold block mb-3">
                        EM ANDAMENTO
                      </span>
                      <h3 className="text-white font-black text-[4rem] @[1280px]:text-[4.8rem] leading-[1.08] tracking-tight mb-6 whitespace-pre-line">
                        {campaign.title}
                      </h3>
                      <div className="inline-flex items-center gap-3 bg-hl-gold/10 border border-hl-gold/30 px-6 py-3 rounded-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-hl-gold-bright" />
                        <span className="text-hl-gold-bright text-xl @[1280px]:text-2xl uppercase tracking-wider font-black font-mono">
                          {campaign.duration}
                        </span>
                      </div>
                    </div>

                    <div className={`p-10 rounded-2xl ${isLightMode ? 'bg-hl-panel border border-hl-line' : 'bg-hl-gold/10 border border-hl-gold/30 shadow-inner'} flex-shrink-0`}>
                      <Icon className="w-28 h-28 @[1280px]:w-32 @[1280px]:h-32 text-hl-gold-bright" />
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={`p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden ${
                  isLightMode ? 'bg-hl-canvas border-2 border-hl-line' : 'bg-hl-canvas/80 backdrop-blur-md border border-hl-gold/20 shadow-xl'
                }`}>
                  <div className="p-6 bg-hl-gold/10 border border-hl-gold/20 rounded-2xl mb-5">
                    <Icon className="w-20 h-20 text-hl-gold-bright" />
                  </div>

                  <h3 className="text-white font-black text-[2.8rem] @[1280px]:text-[3.4rem] leading-tight mb-4 tracking-tight whitespace-pre-line">
                    {campaign.title}
                  </h3>

                  <div className="mt-auto bg-hl-gold/10 border border-hl-gold/30 px-6 py-2.5 rounded-full">
                    <p className="text-hl-gold-bright text-lg @[1280px]:text-xl uppercase tracking-[0.15em] font-black font-mono">
                      {campaign.duration}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`w-full max-w-4xl p-12 rounded-3xl flex flex-col items-center text-center mx-auto ${
              isLightMode ? 'bg-hl-canvas border-2 border-hl-line' : 'bg-hl-canvas/80 backdrop-blur-md border border-hl-gold/20'
            }`}>
              <div className="p-6 bg-hl-gold/10 border border-hl-gold/20 rounded-2xl mb-5">
                <Flame className="w-18 h-18 text-hl-gold-bright" />
              </div>
              <h3 className="text-white font-extrabold text-[2.8rem] @[1280px]:text-[3.4rem] tracking-tight mb-3">Ainda Não Há Propósitos em Andamento</h3>
              <p className="text-hl-soft text-xl @[1280px]:text-2xl leading-relaxed max-w-2xl font-normal">
                Para saber mais, procure um pastor ou um dos obreiros.
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
export {ProjectedVideo as VideoSlide} from '../ProjectionMedia';

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
  const reducedMotion=useReducedMotion();
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
    <div className="flex items-center justify-center h-full w-full px-14 @[1280px]:px-24 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[800px] h-[800px] blur-[160px]' : 'w-[450px] h-[450px] blur-[75px]'
        } ${isFJU ? 'bg-hl-gold-strong/10' : 'bg-hl-gold/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div
        initial={reducedMotion?false:{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isLightMode ? 0.35 : 0.6, ease: isLightMode ? "easeInOut" : "easeOut" }}
        className="flex flex-col items-center justify-center text-center max-w-[90%] relative z-10"
      >
        <div className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-6 ${
          isFJU
            ? 'bg-hl-gold/10 border border-hl-gold/30'
            : 'bg-white/[0.04] border border-hl-gold/25'
        } backdrop-blur-md`}>
          <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-hl-gold-bright animate-ping' : 'bg-hl-gold-bright/90'}`} />
          <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
            isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'
          }`}>
            EVENTO ESPECIAL
          </span>
        </div>

        <div className={`projection-emblem p-8 @[1280px]:p-10 ${isFJU ? 'rounded-[3rem]' : 'rounded-3xl'} ${
          isLightMode
            ? 'bg-hl-canvas border-2 border-hl-line'
            : isFJU
              ? 'bg-black/60 backdrop-blur-md border border-hl-gold/30 shadow-2xl'
              : 'bg-hl-canvas/80 backdrop-blur-md border border-hl-gold/25 shadow-2xl'
        } mb-6`}>
          <Icon className={`w-32 h-32 @[1280px]:w-36 @[1280px]:h-36 ${
            isFJU
              ? 'text-hl-gold-bright drop-shadow-[0_0_45px_rgba(255,211,79,0.45)]'
              : 'text-hl-gold-bright/90 drop-shadow-[0_0_35px_rgba(255,211,79,0.25)]'
          } ${pulse && isHighMode ? (isFJU ? 'animate-pulse' : 'opacity-95') : ''}`} />
        </div>

        <h1 className={`font-sans font-black text-[4.4rem] @[1280px]:text-[5.4rem] @[1536px]:text-[6.2rem] tracking-tight ${
          isFJU ? 'text-white drop-shadow-[0_12px_40px_rgba(255,211,79,0.35)]' : 'text-white drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
        } leading-[1.08] mb-6`}>
          {meeting.theme}
        </h1>

        <div className={`inline-flex items-center gap-4 px-8 py-3.5 rounded-full ${
          isLightMode ? 'bg-hl-canvas border-2 border-hl-line' : 'bg-hl-canvas/80 border border-hl-gold/25 backdrop-blur-md'
        }`}>
          <p className="text-[2rem] @[1280px]:text-[2.5rem] text-hl-copy font-bold font-mono tracking-wide">
            {formattedDate} — Às <span className={isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright'}>{meeting.time}</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// BAPTISM SLIDE (BATISMO NAS ÁGUAS)
// ==========================================
export const BaptismSlide = ({
  variant,
  post=false,
  effectiveMode: propEffectiveMode,
  isLightModeActive: propIsLightMode
}: {
  variant?: string;
  post?:boolean;
  effectiveMode?: 'high' | 'balanced' | 'light';
  isLightModeActive?: boolean;
}) => {
  const reducedMotion=useReducedMotion();
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';
  const isFJU = variant === 'fju';

  return (
    <div className="flex items-center justify-center h-full w-full px-14 @[1280px]:px-24 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[850px] h-[850px] blur-[170px]' : 'w-[450px] h-[450px] blur-[75px]'
        } ${isFJU ? 'bg-hl-gold-strong/10' : 'bg-sky-500/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div
        initial={reducedMotion?false:{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isLightMode ? 0.35 : 0.6, ease: isLightMode ? "easeInOut" : "easeOut" }}
        className="flex flex-col items-center justify-center text-center max-w-[94%] relative z-10"
      >
        <div className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-6 ${
          isFJU
            ? 'bg-hl-gold/10 border border-hl-gold/30'
            : 'bg-white/[0.04] border border-hl-gold/25'
        } backdrop-blur-md`}>
          <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-hl-gold-bright' : 'bg-hl-gold-bright/90'}`} />
          <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
            isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'
          }`}>
            PASSO DE FÉ E SALVAÇÃO
          </span>
        </div>

        <div className={`projection-emblem p-8 @[1280px]:p-10 ${isFJU ? 'rounded-[3rem]' : 'rounded-3xl'} ${
          isLightMode
            ? 'bg-hl-canvas border-2 border-hl-line'
            : isFJU
              ? 'bg-black/60 backdrop-blur-md border border-hl-gold/30 shadow-2xl'
              : 'bg-hl-canvas/80 backdrop-blur-md border border-hl-gold/25 shadow-2xl'
        } mb-6`}>
          <Droplets className={`w-28 h-28 @[1280px]:w-32 @[1280px]:h-32 ${
            isFJU
              ? 'text-hl-gold-bright drop-shadow-[0_0_45px_rgba(255,211,79,0.45)]'
              : 'text-hl-gold-bright/95 drop-shadow-[0_0_35px_rgba(255,211,79,0.25)]'
          }`} />
        </div>

        <h1 className={`font-sans font-black text-[4.4rem] @[1280px]:text-[5.4rem] @[1536px]:text-[6.2rem] tracking-tight text-white leading-[1.08] mb-5 drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]`}>
          Batismo nas Águas
        </h1>

        <p className="text-[2.2rem] @[1280px]:text-[2.6rem] @[1536px]:text-[3rem] text-hl-soft font-normal leading-[1.28] max-w-[90%] mb-6">
          Um novo começo com Deus.
        </p>

        <div className={`inline-flex items-center gap-4 px-8 py-3.5 rounded-full ${
          isLightMode ? 'bg-hl-canvas border-2 border-hl-line' : 'bg-hl-canvas/85 border border-hl-gold/30 backdrop-blur-md shadow-xl'
        }`}>
          <p className="projection-closing-note text-[1.9rem] @[1280px]:text-[2.4rem] text-hl-copy font-semibold tracking-wide">
            {!post&&<>{isFJU?'Após o encontro, ':'Após a reunião, '}</>}<span className="text-hl-gold-bright">{post?'Procure':'procure'} um pastor ou um dos obreiros.</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// BLESSING / POST MEETING SLIDE (DESPEDIDA & BÊNÇÃO)
// ==========================================
export const BlessingSlide = ({
  variant,
  effectiveMode: propEffectiveMode,
  isLightModeActive: propIsLightMode
}: {
  variant?: string;
  effectiveMode?: 'high' | 'balanced' | 'light';
  isLightModeActive?: boolean;
}) => {
  const reducedMotion=useReducedMotion();
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';
  const isFJU = variant === 'fju';

  return (
    <div className="flex items-center justify-center h-full w-full px-14 @[1280px]:px-24 relative select-none">
      {!isLightMode && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isHighMode ? 'w-[850px] h-[850px] blur-[170px]' : 'w-[450px] h-[450px] blur-[75px]'
        } ${isFJU ? 'bg-hl-gold-strong/10' : 'bg-hl-gold/08'} rounded-full pointer-events-none`} />
      )}

      <motion.div
        initial={reducedMotion?false:{ opacity: 0, scale: isLightMode ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: isLightMode ? 0.35 : 0.6, ease: isLightMode ? "easeInOut" : "easeOut" }}
        className="flex flex-col items-center justify-center text-center max-w-[94%] relative z-10"
      >
        <div className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-6 ${
          isFJU
            ? 'bg-hl-gold/10 border border-hl-gold/30'
            : 'bg-white/[0.04] border border-hl-gold/25'
        } backdrop-blur-md`}>
          <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-hl-gold-bright' : 'bg-hl-gold-bright/90'}`} />
          <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.25em] uppercase font-mono ${
            isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'
          }`}>
            {isFJU ? 'VALEU PELA PRESENÇA' : 'DESPEDIDA & FÉ'}
          </span>
        </div>

        <div className={`projection-emblem p-8 @[1280px]:p-10 ${isFJU ? 'rounded-[3rem]' : 'rounded-3xl'} ${
          isLightMode
            ? 'bg-hl-canvas border-2 border-hl-line'
            : isFJU
              ? 'bg-black/60 backdrop-blur-md border border-hl-gold/30 shadow-2xl'
              : 'bg-hl-canvas/80 backdrop-blur-md border border-hl-gold/25 shadow-2xl'
        } mb-6`}>
          <PrayingHands className={`w-28 h-28 @[1280px]:w-32 @[1280px]:h-32 ${
            isFJU
              ? 'text-hl-gold-bright drop-shadow-[0_0_45px_rgba(255,211,79,0.45)]'
              : 'text-hl-gold-bright/95 drop-shadow-[0_0_35px_rgba(255,211,79,0.25)]'
          }`} />
        </div>

        <h1 className={`font-sans font-black text-[4.4rem] @[1280px]:text-[5.4rem] @[1536px]:text-[6.2rem] tracking-tight text-white leading-[1.08] mb-5 drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)]`}>
          {isFJU ? "Valeu por Colar com a Gente!" : "Deus Abençoe a Sua Vida"}
        </h1>

        <p className="text-[2.2rem] @[1280px]:text-[2.6rem] @[1536px]:text-[3rem] text-hl-soft font-normal leading-[1.28] max-w-[90%] mb-6">
          {isFJU
            ? "Continue praticando o que aprendeu."
            : "Vá em paz e que o Espírito Santo acompanhe você e toda a sua família."}
        </p>

        <div className={`inline-flex items-center gap-4 px-8 py-3.5 rounded-full ${
          isLightMode ? 'bg-hl-canvas border-2 border-hl-line' : 'bg-hl-canvas/85 border border-hl-gold/30 backdrop-blur-md shadow-xl'
        }`}>
          <p className="projection-closing-note text-[1.9rem] @[1280px]:text-[2.4rem] text-hl-copy font-semibold tracking-wide">
            {CHURCH_INFO.name} — <span className={isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright'}>{CHURCH_INFO.location}</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

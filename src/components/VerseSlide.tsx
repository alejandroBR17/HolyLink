import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from 'lucide-react';
import { VERSES } from '../data';
import { usePerformanceDiagnostics } from '../utils/performance';

interface VerseSlideProps {
  currentTime: Date;
  verseIndexOffset?: number;
  loopIteration?: number;
  customVerseText?: string | null;
  customVerseRef?: string | null;
  activeVerseIndex?: number | null;
  variant?: string;
  effectiveMode?: 'high' | 'balanced' | 'light';
  isLightModeActive?: boolean;
}

export const VerseSlide: React.FC<VerseSlideProps> = ({ 
  currentTime, 
  verseIndexOffset = 0, 
  loopIteration,
  customVerseText,
  customVerseRef,
  activeVerseIndex,
  variant,
  effectiveMode: propEffectiveMode,
  isLightModeActive: propIsLightMode
}) => {
  const diag = usePerformanceDiagnostics();
  const effectiveMode = propEffectiveMode || diag.effectiveMode;
  const isLightMode = propIsLightMode !== undefined ? propIsLightMode : diag.isLightModeActive;
  const isHighMode = effectiveMode === 'high';

  let verse = { text: "", ref: "" };
  let keyId = "verse";
  const isFJU = variant === 'fju';

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
    if (len < 60) return 'text-[5.5rem] xl:text-[6.8rem] 2xl:text-[7.8rem]';
    if (len < 90) return 'text-[4.6rem] xl:text-[5.6rem] 2xl:text-[6.4rem]';
    if (len < 140) return 'text-[3.8rem] xl:text-[4.6rem] 2xl:text-[5.2rem]';
    return 'text-[3.2rem] xl:text-[3.8rem] 2xl:text-[4.4rem]';
  };

  const getMarginClass = (text: string) => {
    const len = text.length;
    if (len < 90) return 'mt-8 xl:mt-10';
    return 'mt-6 xl:mt-8';
  };

  // Performance-based animation configuration (Anti-Lag uses silky 0.35s GPU-friendly cross-fade)
  const motionProps = isLightMode
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.35, ease: "easeInOut" as const }
      }
    : isHighMode
    ? {
        initial: { opacity: 0, scale: 0.96, y: 14 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 1.03, y: -14 },
        transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const }
      }
    : {
        initial: { opacity: 0, scale: 0.99 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.01 },
        transition: { duration: 0.35, ease: "easeInOut" as const }
      };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-12 sm:px-16 xl:px-28 text-center z-50 relative select-none">
       {/* Ambient glow backdrop - only active when NOT in light/anti-lag mode */}
       {!isLightMode && (
         <div 
           className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
             isHighMode ? 'w-[850px] h-[850px] blur-[160px]' : 'w-[480px] h-[480px] blur-[75px]'
           } ${
             isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/10'
           } rounded-full pointer-events-none`} 
         />
       )}
       
       <AnimatePresence mode="wait">
         <motion.div
           key={keyId}
           {...motionProps}
           className="relative z-10 w-full max-w-[97%] mx-auto flex flex-col items-center"
         >
           {/* Decorative Quote Mark */}
           <div className={`mb-4 sm:mb-5 ${isFJU ? 'text-amber-500/40' : 'text-yellow-500/40'} opacity-80`}>
             <Quote className="w-18 h-18 xl:w-24 xl:h-24 rotate-180" strokeWidth={1.5} />
           </div>

           {/* Verse Text with GPU-safe shadow for Anti-Lag */}
           <h2 
             className={`${getFontSizeClass(verse.text)} text-stone-100 leading-[1.2] font-black tracking-tight ${
               isLightMode 
                 ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]' 
                 : 'drop-shadow-[0_4px_28px_rgba(0,0,0,0.95)]'
             } max-w-[98%] mx-auto font-sans`}
           >
             "{verse.text}"
           </h2>

           {/* Bible Reference Pill with Anti-Lag optimizations */}
           <div
             className={`${getMarginClass(verse.text)} inline-flex items-center gap-4 px-9 py-3 xl:px-11 xl:py-4 rounded-full ${
               isLightMode
                 ? 'bg-zinc-950 border-2'
                 : 'bg-zinc-950/80 backdrop-blur-md border'
             } ${
               isFJU 
                 ? 'border-amber-500/50 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]' 
                 : 'border-amber-500/30 text-amber-300/95 shadow-[0_0_25px_rgba(234,179,8,0.15)]'
             }`}
           >
             <span 
               className={`w-2.5 h-2.5 rounded-full ${
                 isFJU ? (isHighMode ? 'bg-amber-400 animate-ping' : 'bg-amber-400') : 'bg-amber-400/90'
               }`} 
             />
             <p className="text-[2.2rem] xl:text-[2.8rem] font-black tracking-[0.2em] uppercase font-mono leading-none">
               {verse.ref}
             </p>
           </div>
         </motion.div>
       </AnimatePresence>
    </div>
  );
};

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
    if (len < 60) return 'text-[4.6rem] xl:text-[5.4rem]';
    if (len < 90) return 'text-[3.8rem] xl:text-[4.4rem]';
    if (len < 130) return 'text-[3rem] xl:text-[3.6rem]';
    return 'text-[2.4rem] xl:text-[3rem]';
  };

  const getMarginClass = (text: string) => {
    const len = text.length;
    if (len < 90) return 'mt-8 xl:mt-10';
    return 'mt-5 xl:mt-6';
  };

  // Performance-based animation configuration
  const motionProps = isLightMode
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2, ease: "linear" as const }
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
             isHighMode ? 'w-[800px] h-[800px] blur-[150px]' : 'w-[450px] h-[450px] blur-[70px]'
           } ${
             isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/10'
           } rounded-full pointer-events-none`} 
         />
       )}
       
       <AnimatePresence mode="wait">
         <motion.div
           key={keyId}
           {...motionProps}
           className="relative z-10 w-full max-w-[96%] mx-auto flex flex-col items-center"
         >
           {/* Decorative Quote Mark */}
           <div className={`mb-3 sm:mb-4 ${isFJU ? 'text-amber-500/40' : 'text-yellow-500/40'} opacity-75`}>
             <Quote className="w-16 h-16 xl:w-20 xl:h-20 rotate-180" strokeWidth={1.5} />
           </div>

           {/* Verse Text with GPU-safe shadow for Anti-Lag */}
           <h2 
             className={`${getFontSizeClass(verse.text)} text-stone-100 leading-[1.24] font-extrabold tracking-tight ${
               isLightMode 
                 ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]' 
                 : 'drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]'
             } max-w-[96%] mx-auto font-sans`}
           >
             "{verse.text}"
           </h2>

           {/* Bible Reference Pill with Anti-Lag optimizations */}
           <div
             className={`${getMarginClass(verse.text)} inline-flex items-center gap-3 px-7 py-2.5 xl:px-9 xl:py-3.5 rounded-full ${
               isLightMode
                 ? 'bg-zinc-950 border' // Solid dark background in light mode (no heavy backdrop-blur)
                 : 'bg-black/70 backdrop-blur-md border'
             } ${
               isFJU 
                 ? 'border-amber-500/50 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]' 
                 : 'border-yellow-500/50 text-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.2)]'
             }`}
           >
             <span 
               className={`w-2.5 h-2.5 rounded-full bg-amber-400 ${
                 isHighMode ? 'animate-ping' : '' // Static dot in light and balanced mode to save CPU/GPU frames
               }`} 
             />
             <p className="text-[1.8rem] xl:text-[2.2rem] font-black tracking-[0.2em] uppercase font-mono leading-none">
               {verse.ref}
             </p>
           </div>
         </motion.div>
       </AnimatePresence>
    </div>
  );
};



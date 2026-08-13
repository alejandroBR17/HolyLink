import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from 'lucide-react';
import { VERSES } from '../data';

interface VerseSlideProps {
  currentTime: Date;
  verseIndexOffset?: number;
  loopIteration?: number;
  customVerseText?: string | null;
  customVerseRef?: string | null;
  activeVerseIndex?: number | null;
  variant?: string;
}

export const VerseSlide: React.FC<VerseSlideProps> = ({ 
  currentTime, 
  verseIndexOffset = 0, 
  loopIteration,
  customVerseText,
  customVerseRef,
  activeVerseIndex,
  variant
}) => {
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
    if (len < 60) return 'text-[4.8rem] xl:text-[5.5rem]';
    if (len < 90) return 'text-[4rem] xl:text-[4.5rem]';
    if (len < 130) return 'text-[3.2rem] xl:text-[3.8rem]';
    return 'text-[2.6rem] xl:text-[3.2rem]';
  };

  const getMarginClass = (text: string) => {
    const len = text.length;
    if (len < 90) return 'mt-10';
    return 'mt-6';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-16 xl:px-28 text-center z-50 relative select-none">
       {/* Ambient glow backdrop */}
       <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-500/10'} blur-[160px] rounded-full pointer-events-none`} />
       
       <AnimatePresence mode="wait">
         <motion.div
           key={keyId}
           initial={{ opacity: 0, scale: 0.96, y: 15 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 1.03, y: -15 }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="relative z-10 w-full max-w-[95%] mx-auto flex flex-col items-center"
         >
           {/* Decorative Quote Mark */}
           <motion.div
             initial={{ opacity: 0, scale: 0.5 }}
             animate={{ opacity: 0.3, scale: 1 }}
             transition={{ duration: 0.6, delay: 0.1 }}
             className="mb-4 text-amber-500/40"
           >
             <Quote className="w-20 h-20 xl:w-24 xl:h-24 rotate-180" strokeWidth={1.5} />
           </motion.div>

           <h2 className={`${getFontSizeClass(verse.text)} text-stone-100 leading-[1.25] font-extrabold tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] max-w-[96%] mx-auto font-sans`}>
             "{verse.text}"
           </h2>

           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.25 }}
             className={`${getMarginClass(verse.text)} inline-flex items-center gap-3 px-8 py-3 rounded-full bg-black/60 backdrop-blur-md border ${isFJU ? 'border-amber-500/40 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'border-yellow-500/40 text-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.2)]'}`}
           >
             <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
             <p className="text-[2rem] xl:text-[2.4rem] font-black tracking-[0.2em] uppercase font-mono">
               {verse.ref}
             </p>
           </motion.div>
         </motion.div>
       </AnimatePresence>
    </div>
  );
};


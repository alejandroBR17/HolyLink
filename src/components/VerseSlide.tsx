import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VERSES } from '../data';

interface VerseSlideProps {
  currentTime: Date;
  verseIndexOffset?: number;
  loopIteration?: number;
  customVerseText?: string | null;
  customVerseRef?: string | null;
  activeVerseIndex?: number | null;
  lowerThird?: boolean;
}

export const VerseSlide: React.FC<VerseSlideProps> = ({ 
  currentTime, 
  verseIndexOffset = 0, 
  loopIteration,
  customVerseText,
  customVerseRef,
  activeVerseIndex,
  lowerThird = false,
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
    if (lowerThird) return 'text-[2.8rem]';
    const len = text.length;
    if (len < 60) return 'text-[5.5rem]';
    if (len < 90) return 'text-[4.5rem]';
    if (len < 130) return 'text-[3.8rem]';
    return 'text-[3.2rem]';
  };

  const getMarginClass = (text: string) => {
    if (lowerThird) return 'mt-2';
    const len = text.length;
    if (len < 90) return 'mt-12';
    return 'mt-8';
  };

  if (lowerThird) {
    return (
      <div className="flex flex-col items-center justify-end h-full w-full px-12 pb-16 text-left z-50 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={keyId}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-10 w-full bg-black/80 backdrop-blur-md border-l-8 border-yellow-500 p-8 rounded-r-2xl"
          >
            <h2 className={`${getFontSizeClass(verse.text)} text-stone-100 leading-tight font-semibold tracking-tight`}>
              "{verse.text}"
            </h2>
            <p className={`text-yellow-500 text-[1.8rem] font-bold ${getMarginClass(verse.text)} tracking-[0.1em] uppercase`}>
              {verse.ref}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

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

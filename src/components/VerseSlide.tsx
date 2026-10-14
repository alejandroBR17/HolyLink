import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {ProjectionText} from './ProjectionText';
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
    <div className="h-full w-full relative z-50 select-none">
      <AnimatePresence mode="wait">
        <motion.div key={keyId + verse.text + verse.ref} {...motionProps} className="h-full w-full">
          <ProjectionText text={verse.text} reference={verse.ref} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Flame, HeartHandshake, QrCode } from 'lucide-react';
import QRCode from "react-qr-code";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { WEEK_SCHEDULES, CHURCH_INFO, SOCIAL, DONATION, CAMPAIGNS, VERSES } from '../data';
import { CustomMedia } from '../types';

export const IconSlide = ({ icon: Icon, title, subtitle, pulse = false, layout = 'center' }: any) => {
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } } };
  const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } } };

  if (layout === 'split-left') {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="flex items-center justify-between w-full max-w-[95%] px-12">
        <div className="flex-1 text-left pr-20">
          <motion.h1 variants={item} className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">{title}</motion.h1>
          <motion.p variants={item} className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%]">{subtitle}</motion.p>
        </div>
        <motion.div variants={item} className="flex-shrink-0">
          <Icon className={`w-[450px] h-[450px] text-yellow-500 opacity-80 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1} />
        </motion.div>
      </motion.div>
    );
  }

  if (layout === 'split-right') {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="flex items-center justify-between w-full max-w-[95%] px-12">
        <motion.div variants={item} className="flex-shrink-0">
          <Icon className={`w-[450px] h-[450px] text-yellow-500 opacity-80 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1} />
        </motion.div>
        <div className="flex-1 text-right pl-20">
          <motion.h1 variants={item} className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">{title}</motion.h1>
          <motion.p variants={item} className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%] ml-auto">{subtitle}</motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center justify-center text-center max-w-[85%]">
      <motion.div variants={item}><Icon className={`w-56 h-56 text-yellow-500 mb-12 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1.5} /></motion.div>
      <motion.h1 variants={item} className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">{title}</motion.h1>
      <motion.p variants={item} className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%]">{subtitle}</motion.p>
    </motion.div>
  );
};

export const WorldGodSlide = () => {
  const [phase, setPhase] = useState<'world' | 'god'>('world');
  useEffect(() => { const t = setTimeout(() => { setPhase('god'); }, 7500); return () => clearTimeout(t); }, []);
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-5xl h-full w-full">
      <AnimatePresence mode="wait">
        {phase === 'world' ? (
          <motion.div key="world" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <Globe className="w-64 h-64 text-stone-500 mb-14 animate-[spin_20s_linear_infinite]" strokeWidth={1} />
            <h1 className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none uppercase">Desligue-se do mundo</h1>
          </motion.div>
        ) : (
          <motion.div key="god" initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 1.2, ease: "easeOut" }} className="flex flex-col items-center">
            <motion.div><Flame className="w-64 h-64 text-yellow-500 mb-14" strokeWidth={1.5} /></motion.div>
            <h1 className="font-sans font-black text-[7.5rem] tracking-tight text-yellow-500 leading-none uppercase drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">Ligue-se com Deus</h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AgendaDaySlide = ({ dayIndex, currentTime }: { dayIndex: number; currentTime: Date }) => {
  const scheduleDay = WEEK_SCHEDULES.find((s: any) => s.dayIndex === dayIndex) || WEEK_SCHEDULES[dayIndex];
  if (!scheduleDay) return null;
  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center px-16">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
        <h2 className="text-yellow-500 font-bold text-5xl uppercase tracking-widest mb-4">Reuniões de {scheduleDay.dayName}</h2>
        <h1 className="font-sans font-black text-8xl text-white tracking-tight">{scheduleDay.theme}</h1>
      </motion.div>
      <div className="flex justify-center gap-16 flex-wrap">
        {scheduleDay.times.map((time: string, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex flex-col items-center p-10 rounded-3xl border-2 backdrop-blur-md border-stone-800/50 bg-stone-900/30">
            <span className="text-7xl font-bold font-mono text-stone-300">{time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const VerseSlide = ({ 
  currentTime,
  verseIndexOffset = 0,
  loopIteration = 0,
  customVerseText = null, 
  customVerseRef = null,
  activeVerseIndex = null
}: { 
  currentTime: Date;
  verseIndexOffset?: number;
  loopIteration?: number;
  customVerseText?: string | null;
  customVerseRef?: string | null;
  activeVerseIndex?: number | null;
}) => {
  let defaultVerse = VERSES[0];
  if (activeVerseIndex !== null && activeVerseIndex >= 0 && activeVerseIndex < VERSES.length) {
    defaultVerse = VERSES[activeVerseIndex];
  } else {
    const index = (Math.floor(currentTime.getTime() / 60000) + verseIndexOffset + loopIteration) % VERSES.length;
    defaultVerse = VERSES[index];
  }
  const displayTitle = customVerseRef || defaultVerse.ref;
  const displayText = customVerseText || defaultVerse.text;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[90%] text-center px-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <h2 className="text-yellow-500 font-bold text-5xl uppercase tracking-widest mb-16">{displayTitle}</h2>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
        <span className="absolute -top-16 -left-16 text-9xl text-stone-800 font-serif leading-none select-none">"</span>
        <h1 className="font-sans font-bold text-[5.5rem] text-white leading-snug tracking-tight">{displayText}</h1>
        <span className="absolute -bottom-16 -right-16 text-9xl text-stone-800 font-serif leading-none select-none rotate-180">"</span>
      </motion.div>
    </div>
  );
};

export const DonationSlide = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center px-16">
      <HeartHandshake className="w-32 h-32 text-yellow-500 mb-12" strokeWidth={1} />
      <h1 className="font-sans font-black text-8xl tracking-tight text-white leading-none mb-6">Dízimos e Ofertas</h1>
      <p className="text-4xl text-stone-300 mb-16">"Honra ao Senhor com os teus bens..." - Provérbios 3:9</p>
      <div className="bg-white p-6 rounded-3xl mb-8 inline-block">
        <QRCode value={DONATION.url} size={280} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} />
      </div>
      <p className="text-stone-400 text-2xl uppercase tracking-widest mt-4">Escaneie para contribuir</p>
    </div>
  );
};

export const CampaignSlide = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center px-12">
      <h2 className="text-yellow-500 font-bold text-4xl uppercase tracking-widest mb-16">Próximos Eventos</h2>
      <div className="flex flex-wrap justify-center gap-12 w-full max-w-[95%]">
        {CAMPAIGNS.map((c: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} className="flex-1 min-w-[400px] bg-stone-900/60 backdrop-blur-md rounded-[2rem] p-10 border border-stone-800 flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight whitespace-pre-line">{c.title}</h1>
            <span className="text-2xl text-yellow-500 uppercase tracking-wider font-bold">{c.duration}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const VideoSlide = ({ media, currentSlideId, onVideoEnd }: { media: CustomMedia; currentSlideId: string; onVideoEnd?: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (currentSlideId === media.id) {
      video.currentTime = 0;
      video.muted = media.videoMuted !== undefined ? media.videoMuted : false;
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
  }, [currentSlideId, media.id, media.videoMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleEnded = () => {
      if (media.unpinOnEnd && onVideoEnd) {
        onVideoEnd();
      }
    };
    
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [media.unpinOnEnd, onVideoEnd]);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <video ref={videoRef} src={media.url} className="max-w-full max-h-full object-contain" playsInline controls={false} />
    </div>
  );
};

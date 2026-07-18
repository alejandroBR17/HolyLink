import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Flame, HeartHandshake, CalendarDays, WifiOff } from 'lucide-react';
import QRCode from 'react-qr-code';
import { CHURCH_INFO, DONATION, CAMPAIGNS, WEEK_SCHEDULES } from '../../data';

// ==========================================
// REUSABLE ICON SLIDE
// ==========================================
export const IconSlide = ({ icon: Icon, title, subtitle, pulse = false, layout = 'center' }: any) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
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
          <motion.h1 variants={item} className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">
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
          <Icon className={`w-[450px] h-[450px] text-yellow-500 opacity-80 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1} />
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
          <Icon className={`w-[450px] h-[450px] text-yellow-500 opacity-80 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1} />
        </motion.div>
        <div className="flex-1 text-right pl-20">
          <motion.h1 variants={item} className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">
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
        <Icon className={`w-56 h-56 text-yellow-500 mb-12 ${pulse ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
      </motion.div>
      <motion.h1 variants={item} className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">
        {title}
      </motion.h1>
      <motion.p variants={item} className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%]">
        {subtitle}
      </motion.p>
    </motion.div>
  );
};

// ==========================================
// SPECIAL SLIDES
// ==========================================

export const WorldGodSlide = () => {
  const [phase, setPhase] = useState<'world' | 'god'>('world');
  
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
            <Globe className="w-64 h-64 text-stone-500 mb-14 animate-[spin_20s_linear_infinite]" strokeWidth={1} />
            <h1 className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none uppercase">
              Desligue-se do mundo
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
              <Flame className="w-64 h-64 text-yellow-500 mb-14" strokeWidth={1.5} />
            </motion.div>
            <h1 className="font-sans font-black text-[7.5rem] tracking-tight text-yellow-500 leading-none uppercase drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              Ligue-se com Deus
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AgendaDaySlide = ({ dayIndex, currentTime }: { dayIndex: number; currentTime: Date }) => {
  const schedule = WEEK_SCHEDULES.find(s => s.dayIndex === dayIndex) || WEEK_SCHEDULES[0];
  const isToday = currentTime.getDay() === dayIndex;
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };
  
  const item = {
    hidden: { opacity: 0, x: -40 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 60 } }
  };

  const itemRight = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 60 } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="flex items-center justify-between max-w-[95%] w-full px-10"
    >
      <div className="flex-1 text-left pr-16 border-r border-white/[0.1]">
        <motion.span variants={item} className="text-yellow-500 font-bold uppercase tracking-[0.4em] mb-6 text-3xl block">
          {isToday ? 'Reuniões de Hoje' : 'Agenda Semanal'}
        </motion.span>
        <motion.h3 variants={item} className="text-stone-200 font-bold uppercase tracking-[0.3em] mb-6 text-[2.5rem]">
          {schedule.dayName}
        </motion.h3>
        <motion.h2 variants={item} className="text-[7.5rem] text-white font-black uppercase tracking-tight leading-none mt-4">
          {schedule.theme}
        </motion.h2>
      </div>
      <div className="flex-1 pl-16">
        <motion.div variants={itemRight} className="grid grid-cols-2 gap-6">
          {schedule.times.map((t, i) => (
            <motion.div 
              key={t} 
              className="bg-white/[0.03] border border-white/[0.08] px-12 py-10 rounded-3xl shadow-xl flex items-center justify-center relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <span className="font-mono text-[4.5rem] font-black tracking-wider relative z-10 text-white">{t}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export const DonationSlide = () => {
  return (
    <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="flex items-center justify-between w-full max-w-[95%] px-20"
    >
      <div className="flex-1 text-left pr-20">
        <motion.div className="flex items-center gap-4 mb-6">
          <HeartHandshake className="w-24 h-24 text-yellow-500" strokeWidth={1.5} />
          <span className="text-yellow-500 font-bold uppercase tracking-[0.4em] text-3xl">Dízimos e Ofertas</span>
        </motion.div>
        <h1 className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8">
          Faça sua <br />Doação
        </h1>
        <p className="text-[3.5rem] text-stone-200 font-normal mt-6 leading-snug max-w-[90%] mb-12">
          Acesse <span className="text-yellow-500 font-bold">{DONATION.url.replace(/^https?:\/\//, '')}</span> ou escaneie o QR Code ao lado.
        </p>
        <div className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-2xl inline-block">
           <p className="text-stone-300 text-3xl font-medium">Lembre-se de enviar o comprovante</p>
           <p className="text-stone-400 text-2xl mt-2">O WhatsApp está disponível no site.</p>
        </div>
      </div>
      <motion.div className="flex-shrink-0 bg-white p-6 rounded-3xl">
        <QRCode value={DONATION.url} size={480} />
      </motion.div>
    </motion.div>
  );
};

export const CampaignSlide = () => {
  return (
    <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="flex flex-col items-center justify-center text-center max-w-[95%] w-full"
    >
      <CalendarDays className="w-16 h-16 text-stone-500 mb-4" strokeWidth={1.5} />
      <h1 className="font-sans font-semibold text-4xl tracking-wide text-stone-400 uppercase mb-16">
        Propósitos Atuais
      </h1>
      <div className="grid grid-cols-2 gap-10 w-full">
        {CAMPAIGNS.map((campaign, index) => {
          const Icon = campaign.type === 'jejum_daniel' ? WifiOff : Flame;
          return (
            <div key={index} className="bg-white/[0.03] border border-white/[0.08] p-16 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <Icon className="w-48 h-48 text-yellow-500 mb-12" strokeWidth={1} />
               <h3 className="text-white font-black text-[6rem] mb-8 tracking-tight leading-none drop-shadow-[0_0_30px_rgba(234,179,8,0.3)] whitespace-pre-line">{campaign.title}</h3>
               <p className="text-yellow-500 text-4xl uppercase tracking-[0.2em] font-bold mt-6">{campaign.duration}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export const VideoSlide = ({ media, currentSlideId, videoPinBehavior, onVideoEnded }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (currentSlideId === media.id) {
      if (video.src !== media.url) {
        video.src = media.url;
        video.currentTime = 0;
      }
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
  }, [currentSlideId, media.id, media.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = media.muted !== undefined ? media.muted : true;
  }, [media.muted]);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <video
        ref={videoRef}
        className="max-w-full max-h-full object-contain"
        playsInline
        controls={false}
        loop={videoPinBehavior !== 'unpin'}
        onEnded={() => {
          if (onVideoEnded) {
            onVideoEnded();
          }
        }}
      />
    </div>
  );
};

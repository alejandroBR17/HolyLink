const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// IconSlide split-left
code = code.replace(
  'className="flex items-center justify-between w-full max-w-7xl px-20"',
  'className="flex items-center justify-between w-full max-w-[95%] px-12"'
);
code = code.replace(
  'className="font-sans font-black text-[5.5rem] tracking-tight text-white leading-none mb-6"',
  'className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8"'
);
code = code.replace(
  'className="text-[2.75rem] text-stone-200 font-normal mt-2 leading-snug max-w-3xl"',
  'className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%]"'
);
code = code.replace(
  '<Icon className={`w-[250px] h-[250px] text-yellow-500 opacity-80',
  '<Icon className={`w-[450px] h-[450px] text-yellow-500 opacity-80'
);

// IconSlide split-right
code = code.replace(
  'className="flex items-center justify-between w-full max-w-7xl px-20"',
  'className="flex items-center justify-between w-full max-w-[95%] px-12"'
);
code = code.replace(
  '<Icon className={`w-[250px] h-[250px] text-yellow-500 opacity-80',
  '<Icon className={`w-[450px] h-[450px] text-yellow-500 opacity-80'
);
code = code.replace(
  'className="font-sans font-black text-[5.5rem] tracking-tight text-white leading-none mb-6"',
  'className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8"'
);
code = code.replace(
  'className="text-[2.75rem] text-stone-200 font-normal mt-2 leading-snug max-w-3xl ml-auto"',
  'className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%] ml-auto"'
);

// IconSlide center
code = code.replace(
  'className="flex flex-col items-center justify-center text-center max-w-5xl"',
  'className="flex flex-col items-center justify-center text-center max-w-[85%]"'
);
code = code.replace(
  '<Icon className={`w-32 h-32 text-yellow-500 mb-10',
  '<Icon className={`w-56 h-56 text-yellow-500 mb-12'
);
code = code.replace(
  'className="font-sans font-black text-[5.5rem] tracking-tight text-white leading-none mb-6"',
  'className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8"'
);
code = code.replace(
  'className="text-[2.75rem] text-stone-200 font-normal mt-2 leading-snug max-w-4xl"',
  'className="text-[3.5rem] text-stone-200 font-normal mt-4 leading-snug max-w-[90%]"'
);

// WorldGodSlide
code = code.replace(
  '<Globe className="w-40 h-40 text-stone-500 mb-10 animate-[spin_20s_linear_infinite]" strokeWidth={1} />',
  '<Globe className="w-64 h-64 text-stone-500 mb-14 animate-[spin_20s_linear_infinite]" strokeWidth={1} />'
);
code = code.replace(
  'className="font-sans font-black text-[5.5rem] tracking-tight text-white leading-none uppercase"',
  'className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none uppercase"'
);
code = code.replace(
  '<Flame className="w-40 h-40 text-yellow-500 mb-10" strokeWidth={1.5} />',
  '<Flame className="w-64 h-64 text-yellow-500 mb-14" strokeWidth={1.5} />'
);
code = code.replace(
  'className="font-sans font-black text-[5.5rem] tracking-tight text-yellow-500 leading-none uppercase drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]"',
  'className="font-sans font-black text-[7.5rem] tracking-tight text-yellow-500 leading-none uppercase drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]"'
);

// AgendaDaySlide
code = code.replace(
  'className="flex items-center justify-between max-w-7xl w-full px-10"',
  'className="flex items-center justify-between max-w-[95%] w-full px-10"'
);
code = code.replace(
  'className="text-yellow-500 font-bold uppercase tracking-[0.4em] mb-4 text-2xl block"',
  'className="text-yellow-500 font-bold uppercase tracking-[0.4em] mb-6 text-3xl block"'
);
code = code.replace(
  'className="text-stone-200 font-bold uppercase tracking-[0.3em] mb-4 text-[2rem]"',
  'className="text-stone-200 font-bold uppercase tracking-[0.3em] mb-6 text-[2.5rem]"'
);
code = code.replace(
  'className="text-[5.5rem] text-white font-black uppercase tracking-tight leading-none mt-2"',
  'className="text-[7.5rem] text-white font-black uppercase tracking-tight leading-none mt-4"'
);
code = code.replace(
  'className="bg-white/[0.03] border border-white/[0.08] px-10 py-8 rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden group"',
  'className="bg-white/[0.03] border border-white/[0.08] px-12 py-10 rounded-3xl shadow-xl flex items-center justify-center relative overflow-hidden group"'
);
code = code.replace(
  'className="font-mono text-[3.5rem] font-black tracking-wider relative z-10 text-white"',
  'className="font-mono text-[4.5rem] font-black tracking-wider relative z-10 text-white"'
);

// VerseSlide
code = code.replace(
  'className="text-[4.5rem] text-stone-100 leading-snug font-semibold tracking-tight max-w-5xl mx-auto"',
  'className="text-[5.5rem] text-stone-100 leading-snug font-semibold tracking-tight max-w-[85%] mx-auto"'
);
code = code.replace(
  'className="text-yellow-500 text-[2rem] font-bold mt-12 tracking-[0.2em] uppercase"',
  'className="text-yellow-500 text-[3rem] font-bold mt-16 tracking-[0.2em] uppercase"'
);

// DonationSlide
code = code.replace(
  'className="flex items-center justify-between w-full max-w-7xl px-20"',
  'className="flex items-center justify-between w-full max-w-[95%] px-20"'
);
code = code.replace(
  '<HeartHandshake className="w-16 h-16 text-yellow-500" strokeWidth={1.5} />',
  '<HeartHandshake className="w-24 h-24 text-yellow-500" strokeWidth={1.5} />'
);
code = code.replace(
  'className="text-yellow-500 font-bold uppercase tracking-[0.4em] text-2xl"',
  'className="text-yellow-500 font-bold uppercase tracking-[0.4em] text-3xl"'
);
code = code.replace(
  'className="font-sans font-black text-[5rem] tracking-tight text-white leading-none mb-6"',
  'className="font-sans font-black text-[7.5rem] tracking-tight text-white leading-none mb-8"'
);
code = code.replace(
  'className="text-[2.25rem] text-stone-200 font-normal mt-2 leading-snug max-w-3xl mb-10"',
  'className="text-[3.5rem] text-stone-200 font-normal mt-6 leading-snug max-w-[90%] mb-12"'
);
code = code.replace(
  '<QRCode value={DONATION.url} size={300} />',
  '<QRCode value={DONATION.url} size={480} />'
);
code = code.replace(
  'className="text-stone-300 text-xl font-medium"',
  'className="text-stone-300 text-3xl font-medium"'
);
code = code.replace(
  'className="text-stone-400 text-lg mt-1"',
  'className="text-stone-400 text-2xl mt-2"'
);

// CampaignSlide
code = code.replace(
  'className="flex flex-col items-center justify-center text-center max-w-7xl w-full"',
  'className="flex flex-col items-center justify-center text-center max-w-[95%] w-full"'
);
code = code.replace(
  'className="font-sans font-semibold text-3xl tracking-wide text-stone-400 uppercase mb-12"',
  'className="font-sans font-semibold text-4xl tracking-wide text-stone-400 uppercase mb-16"'
);
code = code.replace(
  '<Icon className="w-32 h-32 text-yellow-500 mb-10" strokeWidth={1} />',
  '<Icon className="w-48 h-48 text-yellow-500 mb-12" strokeWidth={1} />'
);
code = code.replace(
  'className="text-white font-black text-[4.5rem] mb-6 tracking-tight leading-none drop-shadow-[0_0_30px_rgba(234,179,8,0.3)] whitespace-pre-line"',
  'className="text-white font-black text-[6rem] mb-8 tracking-tight leading-none drop-shadow-[0_0_30px_rgba(234,179,8,0.3)] whitespace-pre-line"'
);
code = code.replace(
  'className="text-yellow-500 text-3xl uppercase tracking-[0.2em] font-bold mt-4"',
  'className="text-yellow-500 text-4xl uppercase tracking-[0.2em] font-bold mt-6"'
);


fs.writeFileSync('src/App.tsx', code);

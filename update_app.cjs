const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update imports
code = code.replace(
  "import { WEEK_SCHEDULES, VERSES, SOCIAL, DONATION, CAMPAIGNS, ALERTS } from './data';",
  "import { WEEK_SCHEDULES, VERSES, SOCIAL, DONATION, CAMPAIGNS, CHURCH_INFO } from './data';"
);

// 2. Increase donation slide time
code = code.replace(
  "if (slideId === 'donations') return 15000;",
  "if (slideId === 'donations') return 20000;"
);

// 3. Remove Settings and Alert State
code = code.replace(
  "const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n  const [activeAlert, setActiveAlert] = useState<string | null>(null);",
  ""
);
code = code.replace(
  "const [activeAlert, setActiveAlert] = useState<string | null>(null);",
  ""
);
code = code.replace(
  "const [isSettingsOpen, setIsSettingsOpen] = useState(false);",
  ""
);

// Remove the event listener for settings
code = code.replace(
  `  useEffect(() => {\n    const handleKeyDown = (e: KeyboardEvent) => {\n      if (e.key === 's' || e.key === 'S') {\n        setIsSettingsOpen(prev => !prev);\n      }\n      if (e.key === 'Escape') {\n        setIsSettingsOpen(false);\n        setActiveAlert(null);\n      }\n    };\n    window.addEventListener('keydown', handleKeyDown);\n    return () => window.removeEventListener('keydown', handleKeyDown);\n  }, []);`,
  ""
);

// 4. Update the Active Slides order
const oldActiveSlides = `  const activeSlides: SlideType[] = [
    'agenda_day_0',
    'verse_1',
    'agenda_day_1',
    'agenda_day_2',
    'verse_2',
    'agenda_day_3',
    'agenda_day_4',
    'verse_3',
    'agenda_day_5',
    'agenda_day_6',
    'seat',
    'bathroom',
    'phone',
    'no_chat',
    'social',
    'donations',
    'campaigns',
    'world_god'
  ];`;

const newActiveSlides = `  const activeSlides: SlideType[] = [
    'agenda_day_0',
    'seat',
    'verse_1',
    'campaigns',
    'agenda_day_1',
    'bathroom',
    'agenda_day_2',
    'verse_2',
    'donations',
    'agenda_day_3',
    'phone',
    'agenda_day_4',
    'social',
    'verse_3',
    'agenda_day_5',
    'no_chat',
    'agenda_day_6',
    'world_god'
  ];`;

code = code.replace(oldActiveSlides, newActiveSlides);

// 5. Update the church name in the header
code = code.replace(
  `                <h1 className="font-sans font-black text-[2.5rem] tracking-[0.16em] text-white leading-none">
                  IGREJA UNIVERSAL
                </h1>
                <p className="text-sm font-bold tracking-[0.62em] text-yellow-500 uppercase mt-2">
                  JARDIM OSASCO
                </p>`,
  `                <h1 className="font-sans font-black text-[3rem] tracking-[0.16em] text-white leading-none uppercase">
                  {CHURCH_INFO.name}
                </h1>
                <p className="text-xl font-bold tracking-[0.62em] text-yellow-500 uppercase mt-2">
                  {CHURCH_INFO.location}
                </p>`
);

// 6. Remove cursor-none logic for settings
code = code.replace(
  "className={`w-screen h-screen bg-black overflow-hidden relative select-none font-sans flex items-center justify-center ${isSettingsOpen ? 'cursor-auto' : 'cursor-none'}`}",
  "className={`w-screen h-screen bg-black overflow-hidden relative select-none font-sans flex items-center justify-center cursor-none`}"
);

fs.writeFileSync('src/App.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { WEEK_SCHEDULES, VERSES, SOCIAL, DONATION, CAMPAIGNS } from './data';",
  "import { WEEK_SCHEDULES, VERSES, SOCIAL, DONATION, CAMPAIGNS, ALERTS } from './data';"
);

// Settings
code = code.replace(
  '<button \n                    onClick={() => setActiveAlert(activeAlert === \'baby\' ? null : \'baby\')}\n                    className={`p-4 rounded-xl border text-sm font-bold transition-colors ${activeAlert === \'baby\' ? \'bg-yellow-500 text-black border-yellow-500\' : \'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700\'}`}\n                  >\n                    Choro de Bebê\n                  </button>',
  `<button 
                    onClick={() => setActiveAlert(activeAlert === 'baby' ? null : 'baby')}
                    className={\`p-4 rounded-xl border text-sm font-bold transition-colors \${activeAlert === 'baby' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}\`}
                  >
                    {ALERTS.baby.buttonTitle}
                  </button>`
);

code = code.replace(
  '<button \n                    onClick={() => setActiveAlert(activeAlert === \'car\' ? null : \'car\')}\n                    className={`p-4 rounded-xl border text-sm font-bold transition-colors ${activeAlert === \'car\' ? \'bg-yellow-500 text-black border-yellow-500\' : \'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700\'}`}\n                  >\n                    Veículo / Estacionamento\n                  </button>',
  `<button 
                    onClick={() => setActiveAlert(activeAlert === 'car' ? null : 'car')}
                    className={\`p-4 rounded-xl border text-sm font-bold transition-colors \${activeAlert === 'car' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}\`}
                  >
                    {ALERTS.car.buttonTitle}
                  </button>`
);

// Alert Message
code = code.replace(
  "{activeAlert === 'baby' ? 'Atenção pais: Compareçam ao berçário (EBI).' : 'Proprietário de veículo: Compareça ao estacionamento.'}",
  "{activeAlert === 'baby' ? ALERTS.baby.message : activeAlert === 'car' ? ALERTS.car.message : ''}"
);

fs.writeFileSync('src/App.tsx', code);

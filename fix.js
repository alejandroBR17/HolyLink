const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const searchStr = `// 3. MAIN APP
const DonationSlide = () => {
  return (
    <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="flex items-center justify-between w-full max-w-7xl px-20"
    >const DonationSlide = () => {`;
const replaceStr = `// 3. MAIN APP
const DonationSlide = () => {`;
code = code.replace(searchStr, replaceStr);

const searchStr2 = `    </motion.div>
  );
};iv>
  );
};`;
const replaceStr2 = `    </motion.div>
  );
};`;
code = code.replace(searchStr2, replaceStr2);

fs.writeFileSync('src/App.tsx', code);

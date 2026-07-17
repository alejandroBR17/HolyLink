const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/\{\/\* ==================== SETTINGS & ALERTS ==================== \*\/\}.+?(?=\s*<\/div>\s*<\/div>\s*\);)/s, "");
fs.writeFileSync('src/App.tsx', code);

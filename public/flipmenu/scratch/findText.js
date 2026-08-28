const fs = require('fs');
const html = fs.readFileSync('main.js', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
   if (l.includes('fillText')) console.log(i + ': ' + l.trim());
});

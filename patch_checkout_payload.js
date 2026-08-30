const fs = require('fs');
const path = require('path');
const tsxPath = path.join(__dirname, 'src/app/[lang]/new-user/[menuType]/checkout/page.tsx');
let tsx = fs.readFileSync(tsxPath, 'utf8');

const oldPayload = `    addToCart(customizingService, 1, {
      staff: prefs.therapist === 'random' ? null : { gender: prefs.therapist === 'male' ? 'M' : 'F', rating: 5, avatar: '', names: { en: 'Requested', vi: 'Yêu cầu' }, isRequested: true },
      customNote: prefs.notes.content,
      bodyParts: prefs.bodyParts
    });`;

const newPayload = `    addToCart(customizingService, 1, {
      strength: prefs.strength,
      therapist: prefs.therapist,
      notes: prefs.notes,
      bodyParts: prefs.bodyParts
    });`;

tsx = tsx.replace(oldPayload, newPayload);

fs.writeFileSync(tsxPath, tsx);
console.log("Fixed addToCart payload");

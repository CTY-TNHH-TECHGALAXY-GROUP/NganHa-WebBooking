const fs = require('fs');
const path = require('path');
const tsxPath = path.join(__dirname, 'src/components/CustomForYou/index.tsx');
let tsx = fs.readFileSync(tsxPath, 'utf8');

tsx = tsx.replace(
  "export default function CustomForYouModal({",
  "export default function CustomForYouModal({\n    isOpen,\n    ...props\n}) {\n    console.log('CUSTOM FOR YOU MODAL RENDERED, isOpen:', isOpen);\n    const { onClose, onSave, serviceData, lang, initialData } = props;\n"
);
// replace original destructured props
tsx = tsx.replace(
  /export default function CustomForYouModal\(\{\n    isOpen,\n    \.\.\.props\n\}\) \{\n    console\.log\('CUSTOM FOR YOU MODAL RENDERED, isOpen:', isOpen\);\n    const \{ onClose, onSave, serviceData, lang, initialData \} = props;\n    isOpen,\n    onClose,\n    onSave,\n    serviceData,\n    lang,\n    initialData\n\}: CustomForYouModalProps\) \{/,
  "export default function CustomForYouModal({\n    isOpen,\n    ...props\n}: CustomForYouModalProps) {\n    console.log('CUSTOM FOR YOU MODAL RENDERED, isOpen:', isOpen);\n    const { onClose, onSave, serviceData, lang, initialData } = props as any;\n"
);

fs.writeFileSync(tsxPath, tsx);

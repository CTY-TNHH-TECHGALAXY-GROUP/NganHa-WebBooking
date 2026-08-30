const fs = require('fs');
const path = require('path');
const tsxPath = path.join(__dirname, 'src/app/[lang]/new-user/[menuType]/checkout/page.tsx');
let tsx = fs.readFileSync(tsxPath, 'utf8');

const renderModal = `
      {customizingService && (
        <CustomForYouModal
            isOpen={!!customizingService}
            onClose={() => setCustomizingService(null)}
            onSave={handleSaveCustom}
            serviceData={{
                ID: customizingService.id,
                NAMES: customizingService.names as Record<string, string>,
                FOCUS_POSITION: customizingService.FOCUS_POSITION as any,
                TAGS: customizingService.TAGS as any,
                SHOW_STRENGTH: customizingService.SHOW_STRENGTH,
                HINT: customizingService.HINT as Record<string, string>,
                PRICE_VN: customizingService.priceVND,
                PRICE_USD: customizingService.priceUSD,
                SHOW_NOTES: customizingService.SHOW_NOTES,
                SHOW_PREFERENCES: customizingService.SHOW_PREFERENCES,
                SHOW_GENDER: customizingService.SHOW_GENDER,
                SHOW_FOCUS: customizingService.SHOW_FOCUS,
            }}
            lang={lang as any}
        />
      )}
`;

if (!tsx.includes("<CustomForYouModal")) {
    tsx = tsx.replace(
        "<PaymentModal",
        renderModal + "\n      <PaymentModal"
    );
    fs.writeFileSync(tsxPath, tsx);
    console.log("Added CustomForYouModal to render tree");
} else {
    console.log("CustomForYouModal already rendered");
}

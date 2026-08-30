const fs = require('fs');
const path = require('path');
const tsxPath = path.join(__dirname, 'src/app/[lang]/new-user/[menuType]/checkout/page.tsx');
let tsx = fs.readFileSync(tsxPath, 'utf8');

// 1. Import CustomForYouModal
if (!tsx.includes("import CustomForYouModal")) {
    tsx = tsx.replace(
        "import PaymentModal from '@/components/Checkout/PaymentModal';",
        "import PaymentModal from '@/components/Checkout/PaymentModal';\nimport CustomForYouModal from '@/components/CustomForYou';\nimport { CustomPreferences } from '@/components/CustomForYou/types';"
    );
}

// 2. Add state for customizingService
if (!tsx.includes("const [customizingService")) {
    tsx = tsx.replace(
        "const [activeCategory, setActiveCategory] = useState('');",
        "const [activeCategory, setActiveCategory] = useState('');\n  const [customizingService, setCustomizingService] = useState<Service | null>(null);"
    );
}

// 3. Modify addService to open modal instead of adding directly
const oldAddService = `  const addService = (service: Service, jumpToCart = false) => {
    addToCart(service, 1);
    setActiveDrawerGroup(null);
    setIsServicePickerOpen(false);
    window.requestAnimationFrame(() => document.getElementById('cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };`;

const newAddService = `  const addService = (service: Service, jumpToCart = false) => {
    setActiveDrawerGroup(null);
    setIsServicePickerOpen(false);
    setCustomizingService(service);
  };

  const handleSaveCustom = (prefs: CustomPreferences) => {
    if (!customizingService) return;
    addToCart(customizingService, {
      staff: prefs.therapist === 'random' ? null : { gender: prefs.therapist === 'male' ? 'M' : 'F', rating: 5, avatar: '', names: { en: 'Requested', vi: 'Yêu cầu' }, isRequested: true },
      customNote: prefs.notes.content,
      bodyParts: prefs.bodyParts
    });
    setCustomizingService(null);
    window.requestAnimationFrame(() => document.getElementById('cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };`;

tsx = tsx.replace(oldAddService, newAddService);

// 4. Add the CustomForYouModal to the render tree
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

tsx = tsx.replace("{/* Modals */}", "{/* Modals */}\n" + renderModal);

fs.writeFileSync(tsxPath, tsx);
console.log("Patched page.tsx with CustomForYouModal");

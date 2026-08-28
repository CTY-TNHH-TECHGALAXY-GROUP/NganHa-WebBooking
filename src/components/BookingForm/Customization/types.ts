// ═══════════════════════════════════════
// Customization Types — "Custom for You" feature
// Mirrors wrb-noi-bo-dev/CustomForYou/types.ts
// ═══════════════════════════════════════

export type BodyPartKey = 'HEAD' | 'NECK' | 'SHOULDER' | 'ARM' | 'BACK' | 'THIGH' | 'CALF' | 'FOOT';

export interface CustomPreferences {
  bodyParts: {
    focus: string[];
    avoid: string[];
  };
  strength?: 'light' | 'medium' | 'strong';
  therapist: 'male' | 'female' | 'random';
  notes: string;
}

export const DEFAULT_CUSTOM_PREFERENCES: CustomPreferences = {
  bodyParts: { focus: [], avoid: [] },
  strength: 'medium',
  therapist: 'random',
  notes: '',
};

export const BODY_PARTS: { key: BodyPartKey; labelVi: string; labelEn: string; height: string }[] = [
  { key: 'HEAD', labelVi: 'Đầu', labelEn: 'Head', height: '10%' },
  { key: 'NECK', labelVi: 'Cổ', labelEn: 'Neck', height: '8%' },
  { key: 'SHOULDER', labelVi: 'Vai', labelEn: 'Shoulder', height: '12%' },
  { key: 'ARM', labelVi: 'Tay', labelEn: 'Arm', height: '10%' },
  { key: 'BACK', labelVi: 'Lưng', labelEn: 'Back', height: '12%' },
  { key: 'THIGH', labelVi: 'Đùi', labelEn: 'Thigh', height: '17%' },
  { key: 'CALF', labelVi: 'Bắp chân', labelEn: 'Calf', height: '15%' },
  { key: 'FOOT', labelVi: 'Bàn chân', labelEn: 'Foot', height: '10%' },
];

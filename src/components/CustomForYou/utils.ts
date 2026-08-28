import { LanguageCode } from './types';

// Hàm helper để lấy text theo ngôn ngữ
// Hỗ trợ fallback về 'en' nếu không tìm thấy ngôn ngữ yêu cầu
export const getText = (source: any, lang: string): string => {
    if (!source) return '';

    const key = lang.toLowerCase();

    // Check key trực tiếp
    if (source[key]) return source[key];

    // Xoá logic đổi vn <-> vi vì đã được chuẩn hoá ở gốc (middleware)
    // Nhưng giữ fallback nếu payload từ DB vẫn lưu dưới key 'vn'
    if (key === 'vi' && source['vn']) return source['vn'];

    // Check Uppercase key (VD trong data Service NAMES: { EN: "...", VN: "..." })
    const upperKey = key.toUpperCase();
    if (source[upperKey]) return source[upperKey];
    if (key === 'vi' && source['VN']) return source['VN'];

    // Default fallback
    return source['en'] || source['EN'] || '';
};

/*
 * File: Menu/constants.ts
 * Chức năng: Chứa dữ liệu tĩnh (Static Data) và cấu hình mặc định.
 * Logic chi tiết:
 * - CATEGORIES: Danh sách các danh mục dịch vụ (Body, Foot, Facial, Package...).
 * - SERVICES: Dữ liệu mẫu (Dummy Data) dùng để hiển thị thử nghiệm hoặc fallback.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
import { Category, Service } from './types';

export const CATEGORIES: Category[] = [
    {
        id: 'Body',
        names: {
            en: 'Body Care',
            vi: 'Body Care',
            jp: 'ボディケア',
            kr: '바디 케어',
            cn: '身体护理'
        },
        image: '/category-icons-svg/body-massage.svg'
    },
    {
        id: 'Foot',
        names: {
            en: 'Foot Care',
            vi: 'Foot Care',
            jp: 'フットケア',
            kr: '발 케어',
            cn: '足部护理'
        },
        image: '/category-icons-svg/foot-massage.svg'
    },
    {
        id: 'Ear Clean',
        names: {
            en: 'Ear Clean',
            vi: 'Lấy Ráy Tai',
            jp: '耳掃除',
            kr: '귀 청소',
            cn: '采耳'
        },
        image: '/category-icons-svg/ear-clean.svg'
    },
    {
        id: 'Package',
        names: {
            en: 'Package',
            vi: 'Gói Dịch Vụ',
            jp: 'パッケージ',
            kr: '패키지',
            cn: '套餐'
        },
        image: '/category-icons-svg/package.svg'
    },
    {
        id: 'Premium',
        names: {
            en: 'VIP Package',
            vi: 'Gói Dịch Vụ VIP',
            jp: 'VIPパッケージ',
            kr: 'VIP 패키지',
            cn: 'VIP套餐'
        },
        image: '/category-icons-svg/combo-king.svg'
    },
    {
        id: 'Additional',
        names: {
            en: 'Add On',
            vi: 'Add On',
            jp: 'アドオン',
            kr: '추가',
            cn: '附加'
        },
        image: '/category-icons-svg/adds-on.svg'
    },
    {
        id: 'Barber',
        names: {
            en: 'Barber',
            vi: 'Cắt Tóc',
            jp: '床屋',
            kr: '이발',
            cn: '理发'
        },
        image: '/category-icons-svg/haircut.svg'
    },

    {
        id: 'Manicure & Pedicure',
        names: {
            en: 'Nails',
            vi: 'Làm Móng',
            jp: 'ネイル',
            kr: '네일 케어',
            cn: '美甲'
        },
        image: '/category-icons-svg/nail-care.svg'
    },
];
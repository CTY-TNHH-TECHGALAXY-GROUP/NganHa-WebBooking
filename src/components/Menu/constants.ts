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
            en: 'Body Massage',
            vi: 'Massage Body',
            jp: 'ボディマッサージ',
            kr: '전신 마사지',
            cn: '全身按摩'
        },
        image: '/category-icons-svg/body-massage.svg'
    },
    {
        id: 'Foot',
        names: {
            en: 'Foot Massage',
            vi: 'Massage Chân',
            jp: '足裏マッサージ',
            kr: '발 마사지',
            cn: '足部按摩'
        },
        image: '/category-icons-svg/foot-massage.svg'
    },
    {
        id: 'Hair Wash',
        names: {
            en: 'Hair Wash',
            vi: 'Gội Đầu',
            jp: '洗髪',
            kr: '샴푸',
            cn: '洗头'
        },
        image: '/category-icons-svg/hair-wash.svg'
    },
    {
        id: 'Facial',
        names: {
            en: 'Facial',
            vi: 'Chăm Sóc Mặt',
            jp: 'フェイシャル',
            kr: '페이셜 케어',
            cn: '面部护理'
        },
        image: '/category-icons-svg/facial-care.svg'
    },
    {
        id: 'Heel Skin Shave',
        names: {
            en: 'Heel Care',
            vi: 'Chà Gót Chân',
            jp: 'かかとケア',
            kr: '발뒤꿈치 케어',
            cn: '磨脚皮'
        },
        image: '/category-icons-svg/heel-care.svg'
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
    {
        id: 'Ear Clean',
        names: {
            en: 'Ear Clean',
            vi: 'Ráy Tai',
            jp: '耳掃除',
            kr: '귀 청소',
            cn: '采耳'
        },
        image: '/category-icons-svg/ear-clean.svg'
    },
    {
        id: 'Barber',
        names: {
            en: 'Barber',
            vi: 'Cắt Tóc Nam',
            jp: '理容',
            kr: '이발',
            cn: '男士理发'
        },
        image: '/category-icons-svg/haircut.svg'
    },
    {
        id: 'Premium',
        names: {
            en: 'VIP Package',
            vi: 'Gói VIP',
            jp: 'VIPコース',
            kr: 'VIP 코스',
            cn: 'VIP套餐'
        },
        image: '/category-icons-svg/combo-king.svg'
    },
    {
        id: 'Additional',
        names: {
            en: 'Add-on',
            vi: 'Dịch Vụ Lẻ',
            jp: '追加サービス',
            kr: '추가 서비스',
            cn: '额外服务'
        },
        image: '/category-icons-svg/adds-on.svg'
    }
];
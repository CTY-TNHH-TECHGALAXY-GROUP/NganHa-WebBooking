/*
 * File: Menu/types.ts
 * Chức năng: Định nghĩa toàn bộ cấu trúc dữ liệu (TypeScript Interfaces) cho hệ thống Menu.
 * Logic chi tiết:
 * - MultiLangString: Hỗ trợ đa ngôn ngữ cho tên và mô tả.
 * - Service: Cấu trúc dữ liệu của một dịch vụ (ID, giá, thời gian, hình ảnh...).
 * - CartState: Cấu trúc lưu trữ giỏ hàng (ID -> Số lượng).
 * - SheetState: Quản lý trạng thái đóng/mở của các bảng chọn (Main, Review, Cart).
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */

// 1. Đa ngôn ngữ (Quan trọng để hiển thị tên món theo En/Vi/Cn...)
export interface MultiLangString {
  en: string;
  vi: string;
  cn?: string;
  jp?: string;
  kr?: string;
  [key: string]: string | undefined;
}

export interface ServiceMedia {
  type: 'image' | 'video';
  src: string;
  poster?: string;
  alt?: string;
  start?: number;
  end?: number;
}

// 2. Dữ liệu Dịch vụ (Service) chuẩn hóa
export interface Service {
  id: string;          // VD: "NHS001"
  cat: string;         // VD: "Body" - ID danh mục
  cats?: string[];     // Array of category IDs for multi-category support

  // Thông tin hiển thị
  names: MultiLangString;
  descriptions: MultiLangString;
  img: string;
  media?: ServiceMedia;
  video?: string | ServiceMedia;
  videoSrc?: string;
  videoUrl?: string;
  clipSrc?: string;
  poster?: string;
  thumbnail?: string;
  media_url?: string;
  media_type?: string;

  // Giá và Thời gian
  priceVND: number;
  priceUSD: number;
  timeValue: number;   // 60 (dùng để tính toán)
  timeDisplay?: string; // "60 mins" (dùng để hiển thị)

  // Logic phân loại
  menuType?: 'standard' | 'vip';

  // Custom For You Data
  FOCUS_POSITION?: Record<string, boolean>; // HEAD, NECK...
  TAGS?: MultiLangString[]; // Array of tags [0: Pregnant, 1: Allergy] (Each tag is MultiLangString)
  SHOW_STRENGTH?: boolean;
  HINT?: MultiLangString;
  
  // Categorization & Filtering Tags
  comboTags?: string[];

  // UI Configuration Flags (Task E2+E3)
  SHOW_CUSTOM_FOR_YOU?: boolean;  // Show/hide entire Custom For You modal
  SHOW_NOTES?: boolean;           // Show/hide Notes section in Custom modal
  SHOW_PREFERENCES?: boolean;     // Show/hide Preferences (Strength + Therapist Gender)
  SHOW_GENDER?: boolean;          // Bật/tắt chọn giới tính KTV
  SHOW_FOCUS?: boolean;           // Bật/tắt chức năng Body Map (Focus/Avoid)

  // New Logic Flags
  ACTIVE?: boolean;      // Hiển thị hay không
  BEST_SELLER?: boolean; // Label "Best Seller" bên ngoài
  BEST_CHOICE?: boolean; // Label "Best Choice" bên trong (theo thời gian)
}

// 3. Dữ liệu Danh mục (Category)
export interface Category {
  id: string;
  names: MultiLangString;
  image?: string;
}

// 4. Giỏ hàng & Options
export interface ServiceOptions {
  strength?: 'light' | 'medium' | 'strong';
  therapist?: 'male' | 'female' | 'random';

  // Custom For You New Structure
  bodyParts?: {
    focus: string[];
    avoid: string[];
  };
  notes?: {
    tag0: boolean;
    tag1: boolean;
    content: string;
  };
  addons?: {
    privateRoom?: boolean;
  };
}

export interface CartItem extends Service {
  cartId: string; // ID riêng biệt trong giỏ (để phân biệt cùng món nhưng khác options)
  qty: number;
  options?: ServiceOptions;
  basePriceVND?: number; // Giá gốc trước add-on
  basePriceUSD?: number;
}

// export type CartState = Record<string, number>; // (Legacy - Deactivated)
export type CartState = CartItem[]; // Chuyển sang dùng mảng để lưu chi tiết

// 5. QUẢN LÝ TRẠNG THÁI SHEET (Bảng trượt) - MỚI
// Đây là phần quan trọng để điều khiển MainSheet và ReviewSheet
export type SheetType = 'MAIN' | 'REVIEW' | 'CART' | 'CUSTOM' | null;

export interface SheetState {
  isOpen: boolean;
  type: SheetType;
  // Cho phép data chứa: 1 món (Service) HOẶC 1 nhóm món (Service[]) HOẶC null
  data: Service | Service[] | null | any;
}

// 6. Các type phụ trợ cũ của bạn (Giữ lại để tương thích nếu cần)
export type SupportedLanguage = 'vi' | 'en' | 'jp' | 'kr' | 'cn';

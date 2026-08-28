# 🎨 CANVA WEBSITE REFERENCE - Spa Ngân Hà

## Link Canva Design
**URL:** https://spanganhabycunyoung.my.canva.site/

---

## Phân Tích Thiết Kế (Design Analysis)

### 🎨 Color Palette
| Role        | Color                | Hex Code  |
|-------------|----------------------|-----------|
| Background  | Deep brown/bronze    | `#000000` (dark sections) |
| Primary     | Gold gradient        | `#e7aa51` → `#ffe499` → `#8d5a1b` |
| Text Heading| Gold                 | `#997239` |
| Text Body   | Cream/Off-white      | `#f8f8f8`, `#f4f1e6` |
| Accent      | Red (annotations)    | `#e7191f` |

### 📝 Typography
- **Headings:** Serif font (elegant, luxury feel)
- **Body text:** Sans-serif (clean, readable)
- **Service names:** Gold gradient text with underline

### 📐 Layout Structure
1. **Header/Nav** - Fixed sidebar (left) with vertical navigation
   - Service | Shop | Service Area | Blogs | Academy | Spa Home
   - Language flags (🇻🇳 🇬🇧 🇨🇳 🇯🇵 🇰🇷)
   - Log in | Cart buttons
   - "BOOK NOW" & "PROMOTIONS" CTAs

2. **Hero Section** - Full-width video/image background
   - Logo Spa Ngân Hà
   - Animated entrance

3. **Branch Locations** (2 chi nhánh)
   - **Ngan Ha Barbershop:** 11 Ngô Đức Kế, Q.1
   - **Ngan Ha Spa:** 6B Thi Sách, Q.1
   - Google Maps buttons (gold border, rounded)

4. **Our Story** - Giới thiệu vị trí, kiến trúc khu vực

5. **Service Gallery** - Polaroid-style photo cards
   - 4 hình ảnh dịch vụ thực tế

6. **Service Menu** (5 packages)
   - Ear Clean: 70 min → 650,000đ / $30
   - Heel Skin Shave: 70 min → 600,000đ / $27
   - Hair Wash: 90 min → 770,000đ / $35
   - Facial: 90 min → 800,000đ / $36
   - Barbershop: 120 min → 800,000đ / $39

7. **Blog Section** - 4 blog post cards

8. **Footer**
   - MST: 0317797874
   - Hotline: 02839250925
   - Google Maps embedded for both branches
   - Social links

### 🎯 Key Design Elements
- Gold gradient borders & dividers
- Dark luxury theme (black/brown background)
- Rounded buttons with gold gradient stroke
- Vertical left navigation (sidebar)
- One-page scrolling design
- Polaroid-style image cards
- Red hand-drawn annotation arrows (design notes)

### 📱 Social/Contact Buttons
- Zalo, Facebook Messenger, WhatsApp
- Line, KakaoTalk, WeChat
- Hotline (call)

---

## Ghi Chú Triển Khai (Implementation Notes)
- Website Canva là **bản DEMO mockup**, web thực sẽ xây bằng Next.js
- Giữ **tông màu gold/dark** nhất quán
- Menu lật sách (react-pageflip) thay cho layout phẳng
- i18n 5 ngôn ngữ tích hợp ngay từ đầu
- Data dịch vụ lấy từ Supabase (không hardcode)

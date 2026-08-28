# 🧪 KỊCH BẢN TEST TRƯỚC SHOW (25/07/2026)

> **Ngày tạo:** 24/07/2026  
> **Người thực hiện:** Bạn (hoặc bất kỳ ai trong team)  
> **Thời gian ước tính:** ~45 phút  
> **Mục tiêu:** Đảm bảo 100% các luồng người dùng hoạt động mượt mà trên cả Desktop và Mobile trước khi show.

---

## 📱 CHUẨN BỊ TRƯỚC KHI TEST

- [ ] Mở Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M) → Chọn **iPhone 14 Pro** hoặc **Samsung Galaxy S21**
- [ ] Đảm bảo `npm run dev` đang chạy tại `localhost:3000`
- [ ] Mở thêm 1 tab cho **Supabase Dashboard** để kiểm tra dữ liệu
- [ ] Xóa cache trình duyệt (hoặc dùng chế độ Incognito)

---

## 🔴 LUỒNG 1: TRANG CHỦ (Ưu tiên tối cao — đây là ấn tượng đầu tiên!)

### TC-1.1: Video Hero Load
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Truy cập `localhost:3000` | Trang chủ hiển thị **video nền** (không bị đen hoặc trắng) | |
| 2 | Chờ 3 giây | Video tự động phát, không có thanh loading quay vòng | |
| 3 | Cuộn xuống | Chuyển mượt sang phần "Our Story" (AboutStory) | |

### TC-1.2: Cuốn Sách Lật (Flipbook) trên Desktop
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Cuộn đến phần `#services` | Thấy tiêu đề "Lật từng trang để chọn đúng trải nghiệm bạn muốn" | |
| 2 | Nhìn vào iframe sách | Cuốn sách 3D hiển thị đầy đủ, có hiệu ứng lật | |
| 3 | Click lật sang trang 2, 3 | Trang lật mượt, hình ảnh dịch vụ hiển thị rõ | |
| 4 | Click nút "Thêm vào giỏ" trên 1 dịch vụ | Toast hiện "Đã thêm dịch vụ" + animation hoa bay lên giỏ hàng | |
| 5 | Click icon giỏ hàng (Header) | Popup giỏ hàng mở ra, thấy dịch vụ vừa thêm | |
| 6 | Click "Đặt lịch" trong giỏ hàng | Chuyển hướng sang trang Checkout (`/vi/new-user/standard/checkout`) | |

### TC-1.3: Link CTA dưới sách
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Cuộn xuống dưới sách lật | Thấy nút "Đi tới bước đặt lịch" | |
| 2 | Click nút đó | Chuyển sang `/vi/new-user/standard/checkout` (KHÔNG phải `/en/...`) | |

---

## 🔴 LUỒNG 2: ĐẶT LỊCH (CHECKOUT) — Luồng quan trọng nhất!

### TC-2.1: Checkout trên Desktop
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Truy cập `/vi/new-user/standard/checkout` | Trang Checkout load đầy đủ: nền galaxy + form thông tin | |
| 2 | Cuộn trang lên xuống | Trang cuộn mượt, không bị kẹt | |
| 3 | Điền Họ tên: `Test User` | Input nhận text bình thường | |
| 4 | Chọn Giới tính: `Nữ` | Dropdown hiện ra, chọn được | |
| 5 | Chuyển tab Email → nhập `test@test.com` | Hiển thị ô Email, nhập được | |
| 6 | Chuyển tab Số điện thoại → nhập `0901234567` | Hiển thị ô Phone, nhập được | |
| 7 | Chọn ngày: ngày mai | Nút ngày sáng lên (active) | |
| 8 | Chọn giờ: `10:00` | Nút giờ sáng lên (active) | |
| 9 | Nhấn "Xác nhận đặt lịch" | Modal Payment hiện ra | |
| 10 | Chọn phương thức thanh toán → Next | Modal xác nhận cuối cùng hiện ra | |
| 11 | Nhấn "Xác nhận" | Gọi API `/api/bookings` thành công → Hiện popup Order Confirmed | |

### TC-2.2: Checkout trên Mobile (CỰC KỲ QUAN TRỌNG ⚠️)
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Mở DevTools → iPhone 14 Pro | — | |
| 2 | Truy cập `/vi/new-user/standard/checkout` | Trang hiển thị responsive, không bị tràn ngang | |
| 3 | **Vuốt lên/xuống bằng chuột** | **Trang PHẢI CUỘN ĐƯỢC** (đây là bug vừa fix!) | |
| 4 | Điền form đầy đủ → Đặt lịch | Luồng giống Desktop, modal hiển thị đúng | |
| 5 | Kiểm tra bàn phím ảo (tap vào input) | Input không bị che bởi bàn phím (iOS viewport fix) | |

### TC-2.3: Quay lại từ Checkout
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Đang ở trang Checkout | — | |
| 2 | Click nút "← Menu" (góc trên trái) | Chuyển về trang chủ `/#services` | |
| 3 | Kiểm tra trang chủ | Trang chủ vẫn hoạt động bình thường, sách lật vẫn hiện | |

---

## 🟡 LUỒNG 3: LUỒNG MENU → CHECKOUT (Qua trang Select Menu)

### TC-3.1: Select Menu → Standard Menu → Checkout
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Truy cập `/vi/new-user/select-menu` | Trang chọn menu: Standard và VIP (hoặc Premium) | |
| 2 | Click "Standard" | Chuyển sang `/vi/new-user/standard/menu` | |
| 3 | Kiểm tra trang menu | Sách lật hiển thị (iframe), lật được | |
| 4 | Thêm 1 dịch vụ vào giỏ | Toast hiện, giỏ hàng tăng số lượng | |
| 5 | Click "Book Now" hoặc vào giỏ hàng | Chuyển sang Checkout | |

### TC-3.2: VIP Menu (Ghi nhận trạng thái)
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Truy cập `/vi/new-user/premium/menu` | **Có thể bị 404** (PremiumMenu bị comment out — đã ghi nhận Backlog) | |

> ⚠️ Nếu bị 404, đây là **hành vi đã biết**. Khi show, hãy chỉ demo luồng Standard.

---

## 🟡 LUỒNG 4: HEADER & NAVIGATION

### TC-4.1: Navigation Links
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Click "Home" | Cuộn về đầu trang | |
| 2 | Click "Service" | Cuộn đến `#services` (phần sách lật) | |
| 3 | Click "Blogs" | Mở tab mới → `/blog.html` hiển thị trang blog tĩnh | |
| 4 | Click "Academy" | Không chuyển trang (coming soon) | |

### TC-4.2: Giỏ Hàng (Cart Popup)
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Thêm 2 dịch vụ từ sách lật | Badge trên icon giỏ hàng hiện số `2` | |
| 2 | Click icon giỏ hàng | Popup mở, hiện 2 dịch vụ + Tạm tính | |
| 3 | Click "Đặt lịch" trong popup | Chuyển sang Checkout, giỏ hàng vẫn giữ data | |

---

## 🟢 LUỒNG 5: ADMIN PANEL (Code mới — An toàn 100%)

### TC-5.1: Đăng nhập Admin
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Truy cập `/admin` | Chuyển hướng sang `/admin/login` (do middleware chặn) | |
| 2 | Nhập sai email/mật khẩu | Hiện thông báo lỗi, không vào được | |
| 3 | Nhập đúng tài khoản Admin (đã tạo trong Supabase Auth) | Chuyển vào `/admin/dashboard` | |

### TC-5.2: Admin Dashboard
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Xem Dashboard | Hiển thị Sidebar + nội dung tổng quan | |
| 2 | Click "Flipbook" trên Sidebar | Chuyển sang `/admin/flipbook-pages` | |
| 3 | Click "Bài viết" trên Sidebar | Chuyển sang `/admin/posts` | |
| 4 | Click "Dịch vụ" trên Sidebar | Chuyển sang `/admin/services` | |

### TC-5.3: Upload Ảnh/Video cho Flipbook
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Vào `/admin/flipbook-pages` | Hiển thị form "Thêm trang mới" + danh sách trang (có thể trống) | |
| 2 | Nhập Số trang: `1`, Tiêu đề: `Test`, Loại: Hình ảnh | Form nhận input | |
| 3 | Chọn 1 file ảnh JPG (< 5MB) | File hiện tên trong input | |
| 4 | Click "Thêm trang" | Loading → Thẻ trang mới hiện trong danh sách, có thumbnail ảnh | |
| 5 | Vào Supabase Dashboard → Storage → `media-uploads` | Thấy file ảnh vừa upload | |
| 6 | Click nút Xóa (🗑️) trên trang vừa tạo | Confirm → Trang biến mất khỏi danh sách | |

### TC-5.4: Quản lý Bài viết Blog
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Vào `/admin/posts` | Hiển thị bảng danh sách bài viết | |
| 2 | Click "Thêm bài viết" | Form hiện ra (Slug, Tiêu đề, Nội dung) | |
| 3 | Nhập slug: `test-post`, tiêu đề: `Bài viết thử`, nội dung: `<p>Xin chào</p>` | — | |
| 4 | Click "Lưu bài viết" | Bài viết hiện trong bảng danh sách | |
| 5 | Click "Xóa" | Confirm → Bài viết biến mất | |

### TC-5.5: Upload Media cho Dịch vụ
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Vào `/admin/services` | Hiển thị grid các dịch vụ đang có trong Database | |
| 2 | Click "Ảnh" trên 1 dịch vụ bất kỳ | Chọn file → Upload → Hình ảnh hiện trong khung preview | |
| 3 | Click "Video" trên dịch vụ khác | Chọn file MP4 → Upload → Video player hiện trong khung preview | |

---

## 🔒 LUỒNG 6: KIỂM TRA AN TOÀN (Đảm bảo code mới KHÔNG phá code cũ)

### TC-6.1: Trang chủ vẫn nguyên vẹn sau khi thêm Admin
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Truy cập `localhost:3000` | Trang chủ load bình thường, KHÔNG bị redirect sang `/admin/login` | |
| 2 | Kiểm tra Video Hero | Video vẫn phát, không bị ảnh hưởng bởi middleware | |
| 3 | Kiểm tra Sách lật | Iframe load, lật trang được, thêm dịch vụ được | |
| 4 | Kiểm tra luồng Checkout | Form điền được, API booking vẫn hoạt động | |

### TC-6.2: Blog HTML cũ vẫn truy cập được
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Truy cập `/blog.html` | Trang blog tĩnh hiện ra bình thường | |

### TC-6.3: API Bookings cũ không bị ảnh hưởng
| Bước | Hành động | Kết quả mong đợi | ✅/❌ |
|------|-----------|-------------------|-------|
| 1 | Hoàn tất 1 đơn đặt lịch qua Checkout | API trả về thành công | |
| 2 | Vào Supabase → Bảng `Bookings` | Thấy đơn hàng vừa tạo với đầy đủ thông tin | |

---

## 📋 BẢNG TỔNG KẾT

| Luồng | Số test case | Mức ưu tiên | Ghi chú |
|-------|-------------|-------------|---------|
| 1. Trang chủ | 3 | 🔴 Tối cao | Ấn tượng đầu tiên |
| 2. Checkout | 3 nhóm (11 bước) | 🔴 Tối cao | Luồng kiếm tiền |
| 3. Menu → Checkout | 2 | 🟡 Cao | Demo luồng Standard |
| 4. Header & Cart | 2 | 🟡 Cao | Navigation |
| 5. Admin Panel | 5 | 🟢 Trung bình | Code mới, ít rủi ro |
| 6. Kiểm tra an toàn | 3 | 🔴 Tối cao | Phải pass 100% |

---

## ⚡ CHECKLIST NHANH CHO NGÀY SHOW (Chỉ 5 phút)

Nếu không có thời gian test hết, hãy chạy **5 bước này**:

- [ ] **Bước 1:** Mở `localhost:3000` → Video Hero chạy ✅
- [ ] **Bước 2:** Cuộn xuống → Sách lật hiện ✅ → Thêm 1 dịch vụ vào giỏ ✅
- [ ] **Bước 3:** Vào Checkout → Điền form → Đặt lịch thành công ✅
- [ ] **Bước 4:** Mở DevTools Mobile → Checkout cuộn mượt ✅
- [ ] **Bước 5:** Vào `/admin` → Login → Upload 1 ảnh thử ✅

> 🎯 **Nếu 5 bước trên đều PASS → BẠN ĐÃ SẴN SÀNG ĐI SHOW!**

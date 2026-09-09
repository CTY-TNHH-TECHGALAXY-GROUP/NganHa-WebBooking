<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project handoff notes

- Deployment work should target the `vercel` branch unless the user explicitly says otherwise.
- Read `README.md` and `DEVELOPMENT_NOTES.md` before making feature changes.
- Keep the homepage default on the video hero, not the book section.
- Reuse `src/lib/flipbook/` for flipbook iframe/message behavior.
- Reuse `src/lib/bookingCartStorage.ts` for cart persistence and updates.
- Do not rewrite the book/Galaxy transition with visual masking; fix stale state, transforms, classes, timers, or animation timelines at the source.

---

## 🛡️ CRITICAL RULE: ZERO COLLATERAL DAMAGE & SCOPE ISOLATION (BẮT BUỘC)

> **NGUYÊN TẮC BẢO TOÀN VÀ CÁCH LY PHẠM VI SỬA ĐỔI: SỬA ĐÚNG NƠI - ĐÚNG VIỆC - TUYỆT ĐỐI KHÔNG GÂY ẢNH HƯỞNG CHÉO.**

Mỗi khi chỉnh sửa, sửa lỗi, thêm mới hoặc tối ưu hóa **MỘT VỊ TRÍ / MỘT TÍNH NĂNG**, AI PHẢI tuân thủ 100% các điều kiện sau:

1. **Phạm vi tối thiểu (Strict Single-Target Scope):**
   - Chỉ tác động chính xác vào phần tử, vị trí hoặc logic được người dùng yêu cầu.
   - **Tuyệt đối KHÔNG tự ý xóa, refactor, hoặc sửa đổi** bất kỳ thông tin, thuộc tính, badge, text, icon, hoặc style lân cận nào không liên quan (ví dụ: sửa menu không được làm mất các badge %, sửa trang này không được làm mất style trang khác).

2. **Bảo toàn nguyên trạng (Preserve Existing State & Assets):**
   - Mọi badge (ví dụ `50%`, `30%`, `20%`), nút bấm, icon, ngôn ngữ (i18n), logic cart, và kiểu dáng hiện có đều là chủ đích thiết kế.
   - **CẤM "dọn dẹp ngầm" (silent cleanup):** Không tự ý loại bỏ bất kỳ code nào coi là "thừa" nếu người dùng không yêu cầu trực tiếp "hãy xóa cái này".

3. **Chống vỡ Layout chéo (Zero Cross-Layout Breakage):**
   - Khi chỉnh sửa các component hoặc file dùng chung (`Header`, `Footer`, `LayoutWrapper`, `globals.css`, theme variables):
     - Tuyệt đối không dùng CSS global override (`*`, `body`, `!important` trên thẻ cha chung) gây biến dạng các trang khác.
     - Mọi style phải được giới hạn phạm vi cục bộ (CSS Module, Tailwind scoped container).
     - Phải kiểm tra trước tác động tới tất cả các trang/layout khác đang dùng chung component đó.

4. **Kiểm tra đối chiếu bắt buộc (Pre-Commit Diff Audit):**
   - Trước khi commit hoặc báo cáo xong, AI **BẮT BUỘC** phải rà soát `git diff` từng dòng:
     - Tự hỏi: *"Dòng code này có nằm ngoài phạm vi yêu cầu của user không? Có thuộc tính/badge/layout nào vô tình bị mất không?"*
     - Nếu có bất kỳ dòng nào ngoài phạm vi -> **Khôi phục lại ngay lập tức** trước khi thông báo hoàn tất.


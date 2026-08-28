/*
 * File: Menu/utils.ts
 * Chức năng: Các hàm tiện ích dùng chung (Helper Functions).
 * Logic chi tiết:
 * - formatCurrency(amount): Định dạng số tiền sang chuỗi hiển thị (VD: 100.000).
 *   Sử dụng Intl.NumberFormat với locale 'vi-VN'.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};
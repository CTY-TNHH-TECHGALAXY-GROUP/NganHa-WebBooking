// ═══════════════════════════════════════
// BookingForm i18n — v2 (Curator Redesign)
// Text dictionary with intent & category labels
// ═══════════════════════════════════════

export const t = {
  // Section badge
  badge: 'Đặt Lịch',

  // Main heading
  heading: 'Hôm nay của bạn thế nào?',
  headingHighlight: 'Thư Giãn',
  subheading: 'Hôm nay của bạn thế nào?',

  // ─── Intent Quiz (Step 0 / Curator B) ───
  intent: {
    heading: 'Ngày hôm nay của bạn ra sao?',
    subheading: 'Lắng nghe cơ thể và chọn một hành trình chữa lành nhé.',
    relaxation: 'Thư giãn',
    beauty: 'Làm đẹp',
    recovery: 'Phục hồi',
    grooming: 'Cắt tóc & Râu',
    showAll: 'Xem tất cả dịch vụ',
    skip: 'Bỏ qua',
  },

  // ─── Step labels ───
  steps: {
    service: 'Chọn Dịch Vụ',
    details: 'Thông Tin',
    confirm: 'Xác Nhận',
  },

  // ─── Category labels (fallback if not in CATEGORY_DISPLAY) ───
  category: {
    body: 'Trị Liệu Cơ Thể',
    facial: 'Chăm Sóc Da',
    'hair wash': 'Gội Đầu',
    barber: 'Cắt Tóc',
    'ear clean': 'Lấy Ráy Tai',
    foot: 'Chăm Sóc Chân',
    'heel skin shave': 'Chăm Sóc Gót',
    additional: 'Dịch Vụ Khác',
    all: 'Tất Cả',
  },

  // ─── Field labels ───
  fields: {
    name: 'Họ và tên',
    namePlaceholder: 'Nhập họ và tên đầy đủ',
    email: 'Email',
    emailPlaceholder: 'example@email.com',
    phone: 'Số điện thoại',
    phonePlaceholder: '+84 90 123 4567',
    note: 'Ghi chú thêm',
    notePlaceholder: 'Yêu cầu đặc biệt hoặc thông tin cần biết...',
    date: 'Ngày',
    datePlaceholder: 'Chọn ngày',
    time: 'Giờ',
    timePlaceholder: 'Chọn giờ',
    branch: 'Chi Nhánh',
    staff: 'Sở thích KTV',
    staffAny: 'Không có sở thích',
    staffMale: 'Nam',
    staffFemale: 'Nữ',
    guests: 'Số khách',
  },

  // ─── Service card ───
  service: {
    from: 'từ',
    min: 'phút',
    add: 'Thêm',
    added: 'Đã chọn',
    bestSeller: 'Bán chạy',
    bestChoice: 'Lựa chọn tốt',
    durationLabel: 'Chọn thời gian',
    noServices: 'Không có dịch vụ nào',
    viewAll: 'Xem tất cả dịch vụ',
  },

  // ─── Floating Basket ───
  basket: {
    services: 'dịch vụ',
    minutes: 'phút',
    continue: 'Tiếp tục',
    empty: 'Chưa chọn dịch vụ',
    emptyHint: 'Nhấn + để thêm dịch vụ',
  },

  // ─── Booking Summary ───
  summary: {
    title: 'Tổng đơn hàng',
    service: 'Dịch vụ',
    duration: 'Thời gian',
    durationUnit: 'phút',
    date: 'Ngày',
    time: 'Giờ',
    branch: 'Chi nhánh',
    guests: 'Số khách',
    staff: 'KTV',
    total: 'Tổng cộng',
    noServiceSelected: 'Chưa chọn dịch vụ',
    hint: '👈 Chọn ít nhất 1 dịch vụ để bắt đầu',
  },

  // ─── Buttons ───
  buttons: {
    next: 'Tiếp tục',
    back: 'Quay lại',
    confirm: 'Xác Nhận Đặt Lịch',
    processing: 'Đang xử lý...',
    backToServices: 'Quay lại chọn dịch vụ',
  },

  // ─── Terms ───
  terms: {
    agree: 'Tôi đồng ý với',
    link: 'Điều khoản & Dịch vụ',
  },

  // ─── Validation ───
  validation: {
    selectService: 'Vui lòng chọn ít nhất 1 dịch vụ',
    fillRequired: 'Vui lòng điền đầy đủ thông tin bắt buộc',
    agreeTerms: 'Vui lòng đồng ý với Điều khoản & Dịch vụ',
    nameMin: 'Tên phải có ít nhất 2 ký tự',
    phoneInvalid: 'Số điện thoại không hợp lệ',
    emailInvalid: 'Email không hợp lệ',
  },

  // ─── Empty States ───
  empty: {
    noServices: 'Không có dịch vụ trong danh mục này',
    viewAll: 'Xem tất cả dịch vụ',
    loading: 'Đang tải dịch vụ...',
  },

  // ─── Success screen ───
  success: {
    badge: 'Đã xác nhận',
    title: 'Đặt lịch thành công!',
    subtitle: 'Cảm ơn bạn đã chọn ORIARETREAT Spa. Chúng tôi rất mong được phục vụ bạn.',
    bookingCode: 'Mã đặt lịch',
    customerName: 'Họ tên',
    phone: 'Điện thoại',
    services: 'Dịch vụ',
    dateTime: 'Ngày & Giờ',
    branch: 'Chi nhánh',
    total: 'Tổng cộng',
    backHome: 'Về trang chủ',
    bookMore: 'Đặt thêm',
    note: '• Vui lòng đến trước 10 phút · Mang theo mã đặt lịch này',
  },

  // ─── Service Detail Sheet ───
  sheet: {
    addToBasket: 'Thêm vào giỏ',
    update: 'Cập nhật',
    quantity: 'Số lượng',
    duration: 'Thời lượng',
    price: 'Giá tiền',
    selectedVariants: 'Bạn đã chọn:',
    addMore: 'Thêm tùy chọn thời gian khác',
    total: 'Tổng cộng',
    customForYou: 'Tùy chỉnh dịch vụ',
    customized: 'Đã tùy chỉnh',
    skipCustom: 'Bỏ qua',
  },
} as const;

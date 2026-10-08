// Customer copy for the web-claim e-voucher card, "Saved!" sheet and /v/{code}, 5 languages.
// Every RPC error code has its own sentence (never the generic 409 "check your cart").

export type WebVoucherLang = 'vi' | 'en' | 'cn' | 'jp' | 'kr';

export type WebVoucherErrorCode =
  | 'FEATURE_DISABLED'
  | 'CAMPAIGN_NOT_FOUND'
  | 'CAMPAIGN_NOT_STARTED'
  | 'CAMPAIGN_PAUSED'
  | 'CAMPAIGN_INACTIVE'
  | 'CAMPAIGN_ENDED'
  | 'SOLD_OUT'
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'VOUCHER_NOT_FOUND'
  | 'VOUCHER_EXPIRED'
  | 'VOUCHER_CANCELLED'
  | 'VOUCHER_ALREADY_USED'
  | 'WEB_BOOKING_REQUIRED'
  | 'PHONE_LIMIT_REACHED'
  | 'VOUCHER_CUSTOMER_REQUIRED'
  | 'ORDER_CONDITION_NOT_MET'
  | 'BOT_DETECTED'
  | 'SERVICE_NOT_BOOKABLE'
  | 'NETWORK'
  | 'UNKNOWN';

export interface WebVoucherStrings {
  eyebrow: string;
  remaining: (available: number, total: number) => string;
  state: { OPEN: string; PAUSED: string; SOLD_OUT: string; ENDED: string; NOT_STARTED: (date: string) => string };
  appliesTo: string;
  allServices: string;
  maxDiscount: (amount: string) => string;
  validUntil: (date: string) => string;
  save: string;
  saving: string;
  savedTitle: string;
  savedReused: string;
  holdUntil: (time: string) => string;
  yourCode: string;
  copyCode: string;
  copyLink: string;
  copied: string;
  viewVoucher: string;
  continueBooking: string;
  otherDevice: string;
  alreadySaved: string;
  viewSaved: string;
  close: string;
  // /v/{code}
  pageTitle: string;
  claimStatus: Record<'RESERVED' | 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED', string>;
  claimHint: Record<'RESERVED' | 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED', string>;
  bookingRef: (ref: string) => string;
  bookWithVoucher: string;
  qrOpenOnDevice: string;
  backToMenu: string;
  errors: Record<WebVoucherErrorCode, string>;
  checkout: {
    title: string;
    savedFound: string;
    haveCode: string;
    placeholder: string;
    apply: string;
    applying: string;
    remove: string;
    discountLabel: string;
    totalAfter: string;
    estimateNote: string;
    notEligible: (conditions: string) => string;
    rejectedTitle: string;
    rejectedAsk: string;
    bookWithout: string;
    goBack: string;
    replayWithout: string;
    applied: (amount: string) => string;
  };
}

export const WEB_VOUCHER_I18N: Record<WebVoucherLang, WebVoucherStrings> = {
  vi: {
    eyebrow: 'Ưu đãi Web Booking',
    remaining: (a, t) => `Còn ${a}/${t} voucher`,
    state: { OPEN: 'Đang phát', PAUSED: 'Tạm ngưng phát', SOLD_OUT: 'Đã hết voucher', ENDED: 'Chương trình đã kết thúc', NOT_STARTED: (d) => `Mở từ ${d}` },
    appliesTo: 'Áp dụng',
    allServices: 'Mọi dịch vụ',
    maxDiscount: (a) => `Giảm tối đa ${a}`,
    validUntil: (d) => `Hạn dùng ${d}`,
    save: 'Lưu voucher',
    saving: 'Đang lưu…',
    savedTitle: 'Đã lưu!',
    savedReused: 'Thiết bị này đã lưu voucher trước đó, đây là mã của bạn.',
    holdUntil: (t) => `Mã được giữ cho bạn đến ${t}. Hãy đặt lịch trước giờ này để được áp dụng.`,
    yourCode: 'Mã voucher của bạn',
    copyCode: 'Sao chép mã',
    copyLink: 'Sao chép link',
    copied: 'Đã sao chép',
    viewVoucher: 'Xem voucher',
    continueBooking: 'Tiếp tục đặt lịch',
    otherDevice: 'Mở voucher trên thiết bị khác:',
    alreadySaved: 'Bạn đã lưu voucher này',
    viewSaved: 'Xem mã đã lưu',
    close: 'Đóng',
    pageTitle: 'E-Voucher của bạn',
    claimStatus: { RESERVED: 'Đang giữ chỗ', ACTIVE: 'Đã áp dụng cho đơn', REDEEMED: 'Đã sử dụng', EXPIRED: 'Đã hết hạn giữ chỗ', CANCELLED: 'Đã huỷ' },
    claimHint: {
      RESERVED: 'Đặt lịch trên website trước khi hết giờ giữ chỗ, voucher sẽ tự áp dụng.',
      ACTIVE: 'Voucher đã được áp dụng cho lịch hẹn của bạn.',
      REDEEMED: 'Voucher đã được sử dụng. Cảm ơn bạn!',
      EXPIRED: 'Thời gian giữ chỗ đã hết. Bạn có thể lưu voucher mới nếu chương trình còn suất.',
      CANCELLED: 'Voucher này đã bị huỷ.',
    },
    bookingRef: (r) => `Đơn …${r}`,
    bookWithVoucher: 'Đặt lịch với voucher này',
    qrOpenOnDevice: 'Quét mã QR này bằng điện thoại khác để mở voucher.',
    backToMenu: 'Xem menu dịch vụ',
    errors: {
      FEATURE_DISABLED: 'Chương trình voucher hiện không hoạt động.',
      CAMPAIGN_NOT_FOUND: 'Không tìm thấy chương trình voucher.',
      CAMPAIGN_NOT_STARTED: 'Chương trình chưa bắt đầu. Vui lòng quay lại sau.',
      CAMPAIGN_PAUSED: 'Chương trình đang tạm ngưng phát voucher.',
      CAMPAIGN_INACTIVE: 'Chương trình đang tạm ngưng.',
      CAMPAIGN_ENDED: 'Chương trình đã kết thúc.',
      SOLD_OUT: 'Rất tiếc, voucher đã được lưu hết.',
      RATE_LIMITED: 'Bạn thao tác quá nhanh hoặc đã lưu quá nhiều voucher. Vui lòng thử lại sau ít phút.',
      INVALID_REQUEST: 'Yêu cầu không hợp lệ. Vui lòng tải lại trang và thử lại.',
      VOUCHER_NOT_FOUND: 'Mã voucher không tồn tại.',
      VOUCHER_EXPIRED: 'Voucher đã hết hạn giữ chỗ.',
      VOUCHER_CANCELLED: 'Voucher đã bị huỷ.',
      VOUCHER_ALREADY_USED: 'Voucher đã được dùng cho một đơn khác.',
      WEB_BOOKING_REQUIRED: 'Voucher chỉ áp dụng khi đặt lịch trên website.',
      PHONE_LIMIT_REACHED: 'Số điện thoại này đã có voucher chưa sử dụng của chương trình.',
      VOUCHER_CUSTOMER_REQUIRED: 'Vui lòng nhập thông tin khách hàng để áp dụng voucher.',
      ORDER_CONDITION_NOT_MET: 'Đơn chưa đạt điều kiện áp dụng voucher.',
      BOT_DETECTED: 'Không xác minh được trình duyệt. Vui lòng tải lại trang và thử lại.',
      SERVICE_NOT_BOOKABLE: 'Dịch vụ trong giỏ hiện không đặt được. Vui lòng xem lại giỏ hàng.',
      NETWORK: 'Không có kết nối mạng. Vui lòng kiểm tra và thử lại.',
      UNKNOWN: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    },
    checkout: {
      title: 'Voucher Web Booking',
      savedFound: 'Voucher bạn đã lưu',
      haveCode: 'Có mã voucher?',
      placeholder: 'Nhập mã voucher',
      apply: 'Áp dụng',
      applying: 'Đang kiểm tra…',
      remove: 'Bỏ voucher',
      discountLabel: 'Ưu đãi Oria Booking Reward',
      totalAfter: 'Tổng sau giảm',
      estimateNote: 'Số tiền giảm chính xác được xác nhận khi đặt lịch.',
      notEligible: (c) => `Đơn chưa đạt điều kiện áp dụng voucher: ${c}.`,
      rejectedTitle: 'Không áp dụng được voucher',
      rejectedAsk: 'Bạn có muốn tiếp tục đặt lịch không kèm voucher?',
      bookWithout: 'Đặt không kèm voucher',
      goBack: 'Quay lại',
      replayWithout: 'Lịch hẹn này đã được ghi nhận trước đó nên voucher chưa được áp dụng. Voucher vẫn được giữ cho bạn.',
      applied: (a) => `Đã áp dụng voucher: −${a}`,
    },
  },
  en: {
    eyebrow: 'Web Booking offer',
    remaining: (a, t) => `${a}/${t} vouchers left`,
    state: { OPEN: 'Available', PAUSED: 'Paused', SOLD_OUT: 'Fully claimed', ENDED: 'This offer has ended', NOT_STARTED: (d) => `Opens on ${d}` },
    appliesTo: 'Applies to',
    allServices: 'All services',
    maxDiscount: (a) => `Up to ${a} off`,
    validUntil: (d) => `Valid until ${d}`,
    save: 'Save voucher',
    saving: 'Saving…',
    savedTitle: 'Saved!',
    savedReused: 'This device already saved a voucher — here is your code.',
    holdUntil: (t) => `Your code is held until ${t}. Book before then to apply it.`,
    yourCode: 'Your voucher code',
    copyCode: 'Copy code',
    copyLink: 'Copy link',
    copied: 'Copied',
    viewVoucher: 'View voucher',
    continueBooking: 'Continue booking',
    otherDevice: 'Open the voucher on another device:',
    alreadySaved: 'You saved this voucher',
    viewSaved: 'View saved code',
    close: 'Close',
    pageTitle: 'Your E-Voucher',
    claimStatus: { RESERVED: 'On hold', ACTIVE: 'Applied to a booking', REDEEMED: 'Used', EXPIRED: 'Hold expired', CANCELLED: 'Cancelled' },
    claimHint: {
      RESERVED: 'Book on our website before the hold ends and the voucher applies automatically.',
      ACTIVE: 'This voucher has been applied to your booking.',
      REDEEMED: 'This voucher has been used. Thank you!',
      EXPIRED: 'The hold has expired. You can save a new voucher while some are left.',
      CANCELLED: 'This voucher has been cancelled.',
    },
    bookingRef: (r) => `Booking …${r}`,
    bookWithVoucher: 'Book with this voucher',
    qrOpenOnDevice: 'Scan this QR code with another phone to open the voucher.',
    backToMenu: 'View service menu',
    errors: {
      FEATURE_DISABLED: 'The voucher offer is currently unavailable.',
      CAMPAIGN_NOT_FOUND: 'This voucher offer was not found.',
      CAMPAIGN_NOT_STARTED: 'This offer has not started yet. Please come back later.',
      CAMPAIGN_PAUSED: 'Voucher saving is paused for now.',
      CAMPAIGN_INACTIVE: 'This offer is paused.',
      CAMPAIGN_ENDED: 'This offer has ended.',
      SOLD_OUT: 'Sorry, all vouchers have been claimed.',
      RATE_LIMITED: 'Too many attempts. Please try again in a few minutes.',
      INVALID_REQUEST: 'Invalid request. Please reload the page and try again.',
      VOUCHER_NOT_FOUND: 'This voucher code does not exist.',
      VOUCHER_EXPIRED: 'The voucher hold has expired.',
      VOUCHER_CANCELLED: 'This voucher has been cancelled.',
      VOUCHER_ALREADY_USED: 'This voucher was already used for another booking.',
      WEB_BOOKING_REQUIRED: 'This voucher only applies to bookings made on our website.',
      PHONE_LIMIT_REACHED: 'This phone number already has an unused voucher from this offer.',
      VOUCHER_CUSTOMER_REQUIRED: 'Please enter your details to apply the voucher.',
      ORDER_CONDITION_NOT_MET: 'Your booking does not meet the voucher conditions yet.',
      BOT_DETECTED: 'We could not verify your browser. Please reload the page and try again.',
      SERVICE_NOT_BOOKABLE: 'A service in your cart cannot be booked right now. Please review your cart.',
      NETWORK: 'No connection. Please check your network and try again.',
      UNKNOWN: 'Something went wrong. Please try again.',
    },
    checkout: {
      title: 'Web Booking voucher',
      savedFound: 'Your saved voucher',
      haveCode: 'Have a voucher code?',
      placeholder: 'Enter voucher code',
      apply: 'Apply',
      applying: 'Checking…',
      remove: 'Remove voucher',
      discountLabel: 'Oria Booking Reward',
      totalAfter: 'Total after discount',
      estimateNote: 'The exact discount is confirmed when you book.',
      notEligible: (c) => `Your booking does not meet the voucher conditions yet: ${c}.`,
      rejectedTitle: 'The voucher could not be applied',
      rejectedAsk: 'Would you like to continue booking without the voucher?',
      bookWithout: 'Book without voucher',
      goBack: 'Go back',
      replayWithout: 'This booking was already received earlier, so the voucher was not applied. Your voucher is still kept for you.',
      applied: (a) => `Voucher applied: −${a}`,
    },
  },
  cn: {
    eyebrow: '网上预约专享优惠',
    remaining: (a, t) => `剩余 ${a}/${t} 张`,
    state: { OPEN: '领取中', PAUSED: '暂停发放', SOLD_OUT: '已领完', ENDED: '活动已结束', NOT_STARTED: (d) => `${d} 开放领取` },
    appliesTo: '适用',
    allServices: '全部项目',
    maxDiscount: (a) => `最高减 ${a}`,
    validUntil: (d) => `有效期至 ${d}`,
    save: '领取优惠券',
    saving: '领取中…',
    savedTitle: '领取成功！',
    savedReused: '此设备已领取过优惠券，这是您的券码。',
    holdUntil: (t) => `券码为您保留至 ${t}，请在此之前完成预约即可使用。`,
    yourCode: '您的券码',
    copyCode: '复制券码',
    copyLink: '复制链接',
    copied: '已复制',
    viewVoucher: '查看优惠券',
    continueBooking: '继续预约',
    otherDevice: '在其他设备上打开优惠券：',
    alreadySaved: '您已领取此优惠券',
    viewSaved: '查看已领取的券码',
    close: '关闭',
    pageTitle: '您的电子优惠券',
    claimStatus: { RESERVED: '保留中', ACTIVE: '已用于预约', REDEEMED: '已使用', EXPIRED: '保留已过期', CANCELLED: '已取消' },
    claimHint: {
      RESERVED: '请在保留时间结束前通过网站预约，优惠券将自动使用。',
      ACTIVE: '此优惠券已用于您的预约。',
      REDEEMED: '此优惠券已使用，感谢您的光临！',
      EXPIRED: '保留时间已过。若仍有名额，您可以重新领取。',
      CANCELLED: '此优惠券已被取消。',
    },
    bookingRef: (r) => `预约 …${r}`,
    bookWithVoucher: '使用此优惠券预约',
    qrOpenOnDevice: '用另一部手机扫描此二维码即可打开优惠券。',
    backToMenu: '查看服务菜单',
    errors: {
      FEATURE_DISABLED: '优惠券活动目前不可用。',
      CAMPAIGN_NOT_FOUND: '未找到该优惠活动。',
      CAMPAIGN_NOT_STARTED: '活动尚未开始，请稍后再来。',
      CAMPAIGN_PAUSED: '优惠券暂停发放。',
      CAMPAIGN_INACTIVE: '活动已暂停。',
      CAMPAIGN_ENDED: '活动已结束。',
      SOLD_OUT: '很抱歉，优惠券已被领完。',
      RATE_LIMITED: '操作过于频繁，请几分钟后再试。',
      INVALID_REQUEST: '请求无效，请刷新页面后重试。',
      VOUCHER_NOT_FOUND: '券码不存在。',
      VOUCHER_EXPIRED: '优惠券保留时间已过。',
      VOUCHER_CANCELLED: '优惠券已被取消。',
      VOUCHER_ALREADY_USED: '此优惠券已用于其他预约。',
      WEB_BOOKING_REQUIRED: '此优惠券仅适用于网站预约。',
      PHONE_LIMIT_REACHED: '该手机号已有本活动未使用的优惠券。',
      VOUCHER_CUSTOMER_REQUIRED: '请填写客户信息以使用优惠券。',
      ORDER_CONDITION_NOT_MET: '订单尚未满足优惠券使用条件。',
      BOT_DETECTED: '无法验证您的浏览器，请刷新页面后重试。',
      SERVICE_NOT_BOOKABLE: '购物车中的某项服务目前无法预约，请检查购物车。',
      NETWORK: '网络未连接，请检查后重试。',
      UNKNOWN: '出现错误，请重试。',
    },
    checkout: {
      title: '网上预约优惠券',
      savedFound: '您已领取的优惠券',
      haveCode: '有优惠券码？',
      placeholder: '输入优惠券码',
      apply: '使用',
      applying: '正在验证…',
      remove: '取消使用',
      discountLabel: 'Oria 预约礼遇',
      totalAfter: '优惠后合计',
      estimateNote: '实际优惠金额以预约时确认为准。',
      notEligible: (c) => `订单尚未满足优惠券使用条件：${c}。`,
      rejectedTitle: '无法使用此优惠券',
      rejectedAsk: '是否继续预约（不使用优惠券）？',
      bookWithout: '不使用优惠券预约',
      goBack: '返回',
      replayWithout: '此预约此前已提交，因此未使用优惠券。优惠券仍为您保留。',
      applied: (a) => `已使用优惠券：−${a}`,
    },
  },
  jp: {
    eyebrow: 'Web予約限定特典',
    remaining: (a, t) => `残り ${a}/${t} 枚`,
    state: { OPEN: '配布中', PAUSED: '配布一時停止中', SOLD_OUT: '配布終了（上限到達）', ENDED: 'キャンペーンは終了しました', NOT_STARTED: (d) => `${d} から配布開始` },
    appliesTo: '対象',
    allServices: 'すべてのメニュー',
    maxDiscount: (a) => `最大 ${a} 割引`,
    validUntil: (d) => `有効期限 ${d}`,
    save: 'クーポンを保存',
    saving: '保存中…',
    savedTitle: '保存しました！',
    savedReused: 'この端末ではすでにクーポンを保存済みです。こちらがあなたのコードです。',
    holdUntil: (t) => `コードは ${t} まで確保されています。それまでにご予約いただくと適用されます。`,
    yourCode: 'あなたのクーポンコード',
    copyCode: 'コードをコピー',
    copyLink: 'リンクをコピー',
    copied: 'コピーしました',
    viewVoucher: 'クーポンを見る',
    continueBooking: '予約を続ける',
    otherDevice: '別の端末でクーポンを開く：',
    alreadySaved: 'このクーポンは保存済みです',
    viewSaved: '保存したコードを見る',
    close: '閉じる',
    pageTitle: 'あなたのEクーポン',
    claimStatus: { RESERVED: '確保中', ACTIVE: 'ご予約に適用済み', REDEEMED: '利用済み', EXPIRED: '確保期限切れ', CANCELLED: '取消済み' },
    claimHint: {
      RESERVED: '確保期限までにウェブサイトでご予約いただくと、自動で適用されます。',
      ACTIVE: 'このクーポンはご予約に適用されています。',
      REDEEMED: 'このクーポンはご利用済みです。ありがとうございました！',
      EXPIRED: '確保期限が過ぎました。残りがあれば新しいクーポンを保存できます。',
      CANCELLED: 'このクーポンは取り消されました。',
    },
    bookingRef: (r) => `ご予約 …${r}`,
    bookWithVoucher: 'このクーポンで予約する',
    qrOpenOnDevice: '別のスマートフォンでこのQRコードを読み取るとクーポンを開けます。',
    backToMenu: 'メニューを見る',
    errors: {
      FEATURE_DISABLED: '現在クーポンはご利用いただけません。',
      CAMPAIGN_NOT_FOUND: 'キャンペーンが見つかりません。',
      CAMPAIGN_NOT_STARTED: 'キャンペーンはまだ開始していません。後ほどお試しください。',
      CAMPAIGN_PAUSED: 'クーポンの配布を一時停止しています。',
      CAMPAIGN_INACTIVE: 'キャンペーンは一時停止中です。',
      CAMPAIGN_ENDED: 'キャンペーンは終了しました。',
      SOLD_OUT: '申し訳ありません。クーポンはすべて配布されました。',
      RATE_LIMITED: '操作が多すぎます。数分後にもう一度お試しください。',
      INVALID_REQUEST: '無効なリクエストです。ページを再読み込みしてお試しください。',
      VOUCHER_NOT_FOUND: 'このクーポンコードは存在しません。',
      VOUCHER_EXPIRED: 'クーポンの確保期限が切れています。',
      VOUCHER_CANCELLED: 'このクーポンは取り消されました。',
      VOUCHER_ALREADY_USED: 'このクーポンは別のご予約で使用済みです。',
      WEB_BOOKING_REQUIRED: 'このクーポンはウェブサイトからのご予約のみ対象です。',
      PHONE_LIMIT_REACHED: 'この電話番号には未使用のクーポンがすでにあります。',
      VOUCHER_CUSTOMER_REQUIRED: 'クーポンを適用するにはお客様情報を入力してください。',
      ORDER_CONDITION_NOT_MET: 'ご予約内容がクーポンの適用条件を満たしていません。',
      BOT_DETECTED: 'ブラウザを確認できませんでした。ページを再読み込みしてお試しください。',
      SERVICE_NOT_BOOKABLE: 'カート内のサービスは現在予約できません。カートをご確認ください。',
      NETWORK: '接続がありません。ネットワークを確認してもう一度お試しください。',
      UNKNOWN: 'エラーが発生しました。もう一度お試しください。',
    },
    checkout: {
      title: 'Web予約クーポン',
      savedFound: '保存済みのクーポン',
      haveCode: 'クーポンコードをお持ちですか？',
      placeholder: 'クーポンコードを入力',
      apply: '適用',
      applying: '確認中…',
      remove: 'クーポンを外す',
      discountLabel: 'Oria ご予約特典',
      totalAfter: '割引後合計',
      estimateNote: '正確な割引額はご予約時に確定します。',
      notEligible: (c) => `ご予約内容がクーポンの適用条件を満たしていません：${c}。`,
      rejectedTitle: 'クーポンを適用できませんでした',
      rejectedAsk: 'クーポンなしで予約を続けますか？',
      bookWithout: 'クーポンなしで予約',
      goBack: '戻る',
      replayWithout: 'このご予約は以前に受付済みのため、クーポンは適用されていません。クーポンは引き続き確保されています。',
      applied: (a) => `クーポン適用済み：−${a}`,
    },
  },
  kr: {
    eyebrow: '웹 예약 전용 혜택',
    remaining: (a, t) => `${a}/${t}장 남음`,
    state: { OPEN: '발급 중', PAUSED: '발급 일시 중지', SOLD_OUT: '모두 소진', ENDED: '이벤트가 종료되었습니다', NOT_STARTED: (d) => `${d}부터 발급` },
    appliesTo: '적용 대상',
    allServices: '모든 서비스',
    maxDiscount: (a) => `최대 ${a} 할인`,
    validUntil: (d) => `유효 기간 ${d}`,
    save: '바우처 저장',
    saving: '저장 중…',
    savedTitle: '저장되었습니다!',
    savedReused: '이 기기에서 이미 바우처를 저장했습니다. 고객님의 코드입니다.',
    holdUntil: (t) => `코드는 ${t}까지 보관됩니다. 그 전에 예약하시면 적용됩니다.`,
    yourCode: '나의 바우처 코드',
    copyCode: '코드 복사',
    copyLink: '링크 복사',
    copied: '복사됨',
    viewVoucher: '바우처 보기',
    continueBooking: '예약 계속하기',
    otherDevice: '다른 기기에서 바우처 열기:',
    alreadySaved: '이미 저장한 바우처입니다',
    viewSaved: '저장한 코드 보기',
    close: '닫기',
    pageTitle: '나의 E-바우처',
    claimStatus: { RESERVED: '보관 중', ACTIVE: '예약에 적용됨', REDEEMED: '사용 완료', EXPIRED: '보관 기간 만료', CANCELLED: '취소됨' },
    claimHint: {
      RESERVED: '보관 시간이 끝나기 전에 웹사이트에서 예약하시면 자동으로 적용됩니다.',
      ACTIVE: '이 바우처는 고객님의 예약에 적용되었습니다.',
      REDEEMED: '사용이 완료된 바우처입니다. 감사합니다!',
      EXPIRED: '보관 기간이 지났습니다. 남은 수량이 있으면 새로 저장할 수 있습니다.',
      CANCELLED: '취소된 바우처입니다.',
    },
    bookingRef: (r) => `예약 …${r}`,
    bookWithVoucher: '이 바우처로 예약하기',
    qrOpenOnDevice: '다른 휴대폰으로 이 QR 코드를 스캔하면 바우처가 열립니다.',
    backToMenu: '서비스 메뉴 보기',
    errors: {
      FEATURE_DISABLED: '현재 바우처 이벤트를 이용할 수 없습니다.',
      CAMPAIGN_NOT_FOUND: '이벤트를 찾을 수 없습니다.',
      CAMPAIGN_NOT_STARTED: '이벤트가 아직 시작되지 않았습니다. 나중에 다시 방문해 주세요.',
      CAMPAIGN_PAUSED: '바우처 발급이 일시 중지되었습니다.',
      CAMPAIGN_INACTIVE: '이벤트가 일시 중지되었습니다.',
      CAMPAIGN_ENDED: '이벤트가 종료되었습니다.',
      SOLD_OUT: '죄송합니다. 바우처가 모두 소진되었습니다.',
      RATE_LIMITED: '요청이 너무 많습니다. 몇 분 후 다시 시도해 주세요.',
      INVALID_REQUEST: '잘못된 요청입니다. 페이지를 새로고침한 후 다시 시도해 주세요.',
      VOUCHER_NOT_FOUND: '존재하지 않는 바우처 코드입니다.',
      VOUCHER_EXPIRED: '바우처 보관 기간이 만료되었습니다.',
      VOUCHER_CANCELLED: '취소된 바우처입니다.',
      VOUCHER_ALREADY_USED: '이미 다른 예약에 사용된 바우처입니다.',
      WEB_BOOKING_REQUIRED: '이 바우처는 웹사이트 예약에만 적용됩니다.',
      PHONE_LIMIT_REACHED: '이 전화번호로 사용하지 않은 바우처가 이미 있습니다.',
      VOUCHER_CUSTOMER_REQUIRED: '바우처를 적용하려면 고객 정보를 입력해 주세요.',
      ORDER_CONDITION_NOT_MET: '예약 내용이 바우처 적용 조건을 충족하지 않습니다.',
      BOT_DETECTED: '브라우저를 확인할 수 없습니다. 페이지를 새로고침한 후 다시 시도해 주세요.',
      SERVICE_NOT_BOOKABLE: '장바구니의 서비스를 현재 예약할 수 없습니다. 장바구니를 확인해 주세요.',
      NETWORK: '인터넷 연결이 없습니다. 확인 후 다시 시도해 주세요.',
      UNKNOWN: '오류가 발생했습니다. 다시 시도해 주세요.',
    },
    checkout: {
      title: '웹 예약 바우처',
      savedFound: '저장한 바우처',
      haveCode: '바우처 코드가 있으신가요?',
      placeholder: '바우처 코드 입력',
      apply: '적용',
      applying: '확인 중…',
      remove: '바우처 해제',
      discountLabel: 'Oria 예약 리워드',
      totalAfter: '할인 후 합계',
      estimateNote: '정확한 할인 금액은 예약 시 확정됩니다.',
      notEligible: (c) => `예약 내용이 바우처 적용 조건을 충족하지 않습니다: ${c}.`,
      rejectedTitle: '바우처를 적용할 수 없습니다',
      rejectedAsk: '바우처 없이 예약을 계속하시겠습니까?',
      bookWithout: '바우처 없이 예약',
      goBack: '돌아가기',
      replayWithout: '이 예약은 이전에 이미 접수되어 바우처가 적용되지 않았습니다. 바우처는 계속 보관됩니다.',
      applied: (a) => `바우처 적용됨: −${a}`,
    },
  },
};

export const pickWebVoucherLang = (lang: string | null | undefined): WebVoucherLang =>
  (['vi', 'en', 'cn', 'jp', 'kr'] as const).find((l) => l === lang) ?? 'en';

export const webVoucherError = (s: WebVoucherStrings, code: string | null | undefined): string =>
  s.errors[(code ?? 'UNKNOWN') as WebVoucherErrorCode] ?? s.errors.UNKNOWN;

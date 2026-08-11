/*
 * BookingCheckout — 3-step checkout flow for online booking
 * Step 1: Customer Info (Name, Phone, Email, Guests, Staff Preference)
 * Step 2: Date/Time/Branch selection
 * Step 3: Order Summary + Confirm
 */
'use client';

import React, { useState, useMemo } from 'react';
import { useMenuData } from '@/components/Menu/MenuContext';
import { formatCurrency } from '@/components/Menu/utils';
import {
  ArrowLeft, ArrowRight, User, Phone, Mail, Calendar,
  Clock, MapPin, Check, Users, Sparkles, MessageSquare
} from 'lucide-react';

// 🔧 UI CONFIGURATION
const ANIMATION_DURATION = 300;
const BRANCH_LIST = [
  { id: 'barbershop', name: 'ORIA SPA Barbershop', address: '11 Ngô Đức Kế, P. Bến Nghé, Q.1, TP.HCM' },
];
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00',
];
const VISIBLE_TIME_SLOTS = 8;
const MIN_GUESTS = 1;
const MAX_GUESTS = 10;

// i18n dictionary (for future multi-lang)
const TEXT = {
  step1_title: { vi: 'Thông Tin Khách Hàng', en: 'Customer Information' },
  step2_title: { vi: 'Chọn Ngày & Giờ', en: 'Select Date & Time' },
  step3_title: { vi: 'Xác Nhận Đặt Lịch', en: 'Confirm Booking' },
  name: { vi: 'Họ và tên', en: 'Full Name' },
  phone: { vi: 'Số điện thoại', en: 'Phone' },
  email: { vi: 'Email', en: 'Email' },
  note: { vi: 'Ghi chú', en: 'Note' },
  guests: { vi: 'Số khách', en: 'Guests' },
  staff_pref: { vi: 'Giới tính KTV', en: 'Therapist' },
  staff_any: { vi: 'Bất kỳ', en: 'Any' },
  staff_male: { vi: 'Nam', en: 'Male' },
  staff_female: { vi: 'Nữ', en: 'Female' },
  date: { vi: 'Chọn ngày', en: 'Select date' },
  time: { vi: 'Chọn giờ', en: 'Select time' },
  branch: { vi: 'Chi nhánh', en: 'Branch' },
  view_more: { vi: 'Xem thêm', en: 'View more' },
  back: { vi: 'Quay lại', en: 'Back' },
  next: { vi: 'Tiếp tục', en: 'Continue' },
  confirm_btn: { vi: 'XÁC NHẬN ĐẶT LỊCH', en: 'CONFIRM BOOKING' },
  submitting: { vi: 'Đang xử lý...', en: 'Processing...' },
  order_summary: { vi: 'Tóm tắt đơn hàng', en: 'Order Summary' },
  total: { vi: 'Tổng cộng', en: 'Total' },
  duration_label: { vi: 'Thời gian', en: 'Duration' },
  mins: { vi: 'phút', en: 'mins' },
  terms: { vi: 'Tôi đồng ý với điều khoản dịch vụ', en: 'I agree to the terms of service' },
  success_title: { vi: 'Đặt Lịch Thành Công!', en: 'Booking Confirmed!' },
  success_code: { vi: 'Mã đặt lịch', en: 'Booking Code' },
  go_home: { vi: 'VỀ TRANG CHỦ', en: 'GO HOME' },
};

type StaffGender = 'any' | 'male' | 'female';

interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  note: string;
  guests: number;
  staffGender: StaffGender;
  date: string;
  time: string;
  branchId: string;
  agreeTerms: boolean;
}

interface BookingResult {
  bookingId: string;
  billCode: string;
}

interface BookingCheckoutProps {
  lang: string;
  onBack: () => void;
}

const BookingCheckout = ({ lang, onBack }: BookingCheckoutProps) => {
  const t = (key: keyof typeof TEXT) => TEXT[key][lang as 'vi' | 'en'] || TEXT[key]['en'];
  const { cart } = useMenuData();

  const [step, setStep] = useState(1);
  const [showAllTimes, setShowAllTimes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const [form, setForm] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    email: '',
    note: '',
    guests: 1,
    staffGender: 'any',
    date: '',
    time: '',
    branchId: BRANCH_LIST[0]?.id || '',
    agreeTerms: false,
  });

  // Compute totals from cart
  const summary = useMemo(() => {
    let totalVND = 0, totalUSD = 0, totalDuration = 0;
    cart.forEach(item => {
      totalVND += item.priceVND * item.qty;
      totalUSD += item.priceUSD * item.qty;
      totalDuration += item.timeValue * item.qty;
    });
    return { totalVND, totalUSD, totalDuration, itemCount: cart.length };
  }, [cart]);

  // Get tomorrow as minimum date
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Validation
  const canProceed = (s: number) => {
    switch (s) {
      case 1: return !!(form.name.trim() && form.phone.trim());
      case 2: return !!(form.date && form.time);
      case 3: return form.agreeTerms;
      default: return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const selectedBranch = BRANCH_LIST.find(b => b.id === form.branchId);

      // Transform cart items to API format
      const selectedServices = cart.map(item => ({
        variantId: item.id,
        name: item.names?.[lang] || item.names?.en || 'Service',
        duration: item.timeValue,
        priceVND: item.priceVND,
        priceUSD: item.priceUSD,
        quantity: item.qty,
        customOptions: item.options || {},
      }));

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          note: form.note,
          date: form.date,
          time: form.time,
          branchId: form.branchId,
          branchName: selectedBranch?.name || '',
          guests: form.guests,
          staffGender: form.staffGender,
          lang,
          selectedServices,
        }),
      });

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        throw new Error(`Lỗi phản hồi máy chủ (Mã: ${res.status}). Vui lòng thử lại!`);
      }

      if (!res.ok) {
        throw new Error(json.error || `Lỗi HTTP ${res.status}`);
      }

      if (json.success) {
        setBookingResult({
          bookingId: json.data.bookingId,
          billCode: json.data.billCode,
        });
        setIsSuccess(true);
      } else {
        alert(json.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Lỗi kết nối');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ════════════════════════════════════════
  // SUCCESS SCREEN
  // ════════════════════════════════════════
  if (isSuccess && bookingResult) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black">
        <div className="text-center p-8 max-w-md w-full">
          {/* Checkmark */}
          <div className="w-24 h-24 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
            <Check size={48} className="text-black" strokeWidth={4} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 font-luxury">
            {t('success_title')}
          </h2>

          {/* Booking Code */}
          <div className="bg-[#111111] border border-yellow-500/30 rounded-2xl p-4 mb-6 mt-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">{t('success_code')}</p>
            <p className="text-2xl font-bold text-[#D4AF37] font-mono tracking-wider">
              {bookingResult.billCode}
            </p>
          </div>

          {/* Summary */}
          <div className="text-left bg-white/5 rounded-xl p-4 space-y-2 mb-6">
            {cart.map((item, idx) => {
              const tags = [
                item.options?.notes?.tag0 ? 'Pregnant' : null,
                item.options?.notes?.tag1 ? 'Allergy' : null,
                item.options?.notes?.content
              ].filter(Boolean).join(', ');
              return (
              <div key={item.cartId} className="flex justify-between text-sm mb-2">
                <div className="flex-1 pr-2">
                  <span className="text-gray-300">{idx + 1}. {item.names?.[lang] || item.names?.en}</span>
                  {tags && <p className="text-[#C9A96E] text-xs italic mt-0.5">{tags}</p>}
                </div>
                <span className="text-[#D4AF37] font-bold">{formatCurrency(item.priceVND * item.qty)}</span>
              </div>
            )})}
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="text-white font-bold">{t('total')}</span>
              <span className="text-[#D4AF37] font-bold text-lg">{formatCurrency(summary.totalVND)} VND</span>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl text-sm uppercase tracking-widest shadow-lg hover:brightness-110 transition-all active:scale-[0.98]"
          >
            {t('go_home')}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════
  // STEP CONTENT
  // ════════════════════════════════════════
  const visibleTimeSlots = showAllTimes ? TIME_SLOTS : TIME_SLOTS.slice(0, VISIBLE_TIME_SLOTS);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-[100dvh]">

      {/* HEADER with step indicator */}
      <div className="shrink-0 px-5 pt-6 pb-4 bg-black/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={step === 1 ? onBack : () => setStep(s => s - 1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-white font-luxury">
            {step === 1 ? t('step1_title') : step === 2 ? t('step2_title') : t('step3_title')}
          </h2>
          <div className="w-10" /> {/* spacer */}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-[#D4AF37]' : s < step ? 'w-4 bg-[#D4AF37]/50' : 'w-4 bg-white/10'}`} />
          ))}
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 no-scrollbar">

        {/* ─── STEP 1: Customer Info ─── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Name */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('name')} *</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  className="w-full bg-[#111] border border-gray-800 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="Nhập họ và tên" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('phone')} *</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full bg-[#111] border border-gray-800 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="0912 345 678" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className="w-full bg-[#111] border border-gray-800 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="email@example.com" />
              </div>
            </div>

            {/* Guest count */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('guests')}</label>
              <div className="flex items-center gap-4 bg-[#111] border border-gray-800 rounded-xl p-3">
                <Users size={16} className="text-gray-500" />
                <button onClick={() => setForm(p => ({ ...p, guests: Math.max(MIN_GUESTS, p.guests - 1) }))}
                  className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors font-bold text-lg">−</button>
                <span className="text-white font-bold text-lg min-w-[20px] text-center">{form.guests}</span>
                <button onClick={() => setForm(p => ({ ...p, guests: Math.min(MAX_GUESTS, p.guests + 1) }))}
                  className="w-9 h-9 rounded-full bg-[#D4AF37] text-black flex items-center justify-center hover:brightness-110 transition-colors font-bold text-lg">+</button>
              </div>
            </div>

            {/* Staff preference */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('staff_pref')}</label>
              <div className="grid grid-cols-3 gap-3">
                {(['any', 'male', 'female'] as StaffGender[]).map(g => (
                  <button key={g} onClick={() => setForm(p => ({ ...p, staffGender: g }))}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${form.staffGender === g
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-[#111] border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                    {t(`staff_${g}` as keyof typeof TEXT)}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t('note')}</label>
              <div className="relative">
                <MessageSquare size={16} className="absolute left-4 top-4 text-gray-500" />
                <textarea name="note" value={form.note} onChange={handleChange} rows={3}
                  className="w-full bg-[#111] border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                  placeholder="Ghi chú thêm..." />
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Date & Time ─── */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Branch */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">{t('branch')}</label>
              {BRANCH_LIST.map(b => (
                <button key={b.id} onClick={() => setForm(p => ({ ...p, branchId: b.id }))}
                  className={`w-full text-left p-4 rounded-xl border transition-all mb-2 ${form.branchId === b.id
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]'
                    : 'bg-[#111] border-gray-800 hover:border-gray-600'}`}>
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className={form.branchId === b.id ? 'text-[#D4AF37]' : 'text-gray-500'} />
                    <div>
                      <p className={`font-bold text-sm ${form.branchId === b.id ? 'text-[#D4AF37]' : 'text-white'}`}>{b.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{b.address}</p>
                    </div>
                    {form.branchId === b.id && (
                      <div className="ml-auto w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center">
                        <Check size={14} className="text-black" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">{t('date')}</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type="date" name="date" value={form.date} onChange={handleChange} min={minDate}
                  className="w-full bg-[#111] border border-gray-800 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors [color-scheme:dark]" />
              </div>
            </div>

            {/* Time slots */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('time')}</label>
                <Clock size={14} className="text-gray-500" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {visibleTimeSlots.map(slot => (
                  <button key={slot} onClick={() => setForm(p => ({ ...p, time: slot }))}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${form.time === slot
                      ? 'bg-[#D4AF37] text-black shadow-lg shadow-yellow-500/20'
                      : 'bg-[#111] border border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                    {slot}
                  </button>
                ))}
              </div>
              {!showAllTimes && TIME_SLOTS.length > VISIBLE_TIME_SLOTS && (
                <button onClick={() => setShowAllTimes(true)}
                  className="w-full text-center text-sm text-gray-400 hover:text-white mt-3 py-2 transition-colors">
                  {t('view_more')} ({TIME_SLOTS.length - VISIBLE_TIME_SLOTS} slots)
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 3: Confirm ─── */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Order Summary */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('order_summary')}</h3>
              <div className="bg-[#111] rounded-2xl p-4 space-y-3 border border-gray-800">
                {cart.map((item, idx) => {
                  const tags = [
                    item.options?.notes?.tag0 ? 'Pregnant' : null,
                    item.options?.notes?.tag1 ? 'Allergy' : null,
                    item.options?.notes?.content
                  ].filter(Boolean).join(', ');
                  return (
                  <div key={item.cartId} className="flex justify-between items-start mb-2">
                    <div className="min-w-0 pr-3">
                      <p className="text-white text-sm font-medium">{idx + 1}. {item.names?.[lang] || item.names?.en}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.timeValue} {t('mins')} × {item.qty}</p>
                      {tags && <p className="text-[#C9A96E] text-xs italic mt-0.5">{tags}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[#D4AF37] text-sm font-bold">{formatCurrency(item.priceVND * item.qty)}</p>
                      <p className="text-red-500 text-[10px] font-bold">{item.priceUSD * item.qty} USD</p>
                    </div>
                  </div>
                )})}

                <div className="border-t border-gray-800 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('duration_label')}</span>
                    <span className="text-white font-bold">{summary.totalDuration} {t('mins')}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-[#D4AF37] font-bold uppercase text-xs tracking-wider">{t('total')}</span>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(summary.totalVND)} VND</p>
                      <p className="text-red-500 font-bold text-sm">{summary.totalUSD} USD</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking details */}
            <div className="bg-[#111] rounded-2xl p-4 space-y-2 border border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('name')}</span>
                <span className="text-white font-bold">{form.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('phone')}</span>
                <span className="text-white font-bold">{form.phone}</span>
              </div>
              {form.email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('email')}</span>
                  <span className="text-white font-bold truncate max-w-[200px]">{form.email}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('date')}</span>
                <span className="text-white font-bold">{form.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('time')}</span>
                <span className="text-white font-bold">{form.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('branch')}</span>
                <span className="text-white font-bold">{BRANCH_LIST.find(b => b.id === form.branchId)?.name}</span>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-[#111] rounded-xl border border-gray-800">
              <div className="relative mt-0.5 shrink-0">
                <div className={`w-5 h-5 rounded transition-all flex items-center justify-center ${form.agreeTerms ? 'bg-[#D4AF37]' : 'border border-gray-600'}`}>
                  <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange}
                    className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Check className={`w-3 h-3 text-black transition-transform ${form.agreeTerms ? 'scale-100' : 'scale-0'}`} />
                </div>
              </div>
              <span className="text-gray-400 text-sm">{t('terms')}</span>
            </label>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="shrink-0 p-4 bg-black/90 backdrop-blur-xl border-t border-white/5"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed(step)}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-[0.98]">
            <span>{t('next')}</span>
            <ArrowRight size={16} strokeWidth={3} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isSubmitting || !canProceed(3)}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-[0.98]">
            <span>{isSubmitting ? t('submitting') : t('confirm_btn')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingCheckout;

'use client';

import React, { useEffect, useState } from 'react';
import { 
    X, 
    ClipboardList, 
    Clock, 
    ArrowRight, 
    ArrowLeft, 
    Check, 
    Edit3, 
    CreditCard, 
    Banknote, 
    QrCode, 
    DollarSign, 
    Wallet, 
    Receipt, 
    Calendar, 
    Sparkles, 
    AlertCircle, 
    Phone, 
    Mail, 
    MapPin 
} from 'lucide-react';
import SmartLogo from '@/components/SmartLogo';
import { CartItem } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';
import { createClient } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import AlertModal from '@/components/Shared/AlertModal';

const UI_CONFIG = {
    MODAL_MAX_WIDTH: '880px',
    TABLET_RESET_SECONDS: 180,
    QR_SIZE: 200,
    JOURNEY_BASE_URL: 'https://nganha.vercel.app',
};

interface OrderConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { paymentMethod: string }) => Promise<string | null>;
    lang: string;
    dict: any;
    cart: CartItem[];
    customerInfo: {
        name: string;
        email: string;
        phone: string;
        gender: string;
    };
    paymentMethod?: string;
    amountPaid?: number;
    guestCount?: number;
    bookingDate?: string;
    bookingTime?: string;
    onEditService?: (item: CartItem) => void;
    onEditCustomerInfo?: () => void;
}

export default function OrderConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    lang,
    dict,
    cart,
    customerInfo,
    paymentMethod: initialPaymentMethod = 'cash_vnd',
    guestCount = 1,
    bookingDate,
    bookingTime,
    onEditService,
    onEditCustomerInfo,
}: OrderConfirmModalProps) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [selectedPayment, setSelectedPayment] = useState<string>(initialPaymentMethod || 'cash_vnd');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [isTabletDevice, setIsTabletDevice] = useState(false);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            if (initialPaymentMethod) {
                setSelectedPayment(initialPaymentMethod);
            }
        }
    }, [isOpen, initialPaymentMethod]);

    useEffect(() => {
        const checkDevice = async () => {
            const deviceId = localStorage.getItem('REGISTERED_DEVICE_ID');
            if (!deviceId) return;
            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from('RegisteredDevices')
                    .select('id')
                    .eq('device_id', deviceId)
                    .eq('is_active', true)
                    .single();
                if (data) setIsTabletDevice(true);
            } catch { /* not a tablet */ }
        };
        checkDevice();
    }, []);

    if (!isOpen) return null;

    const totalVND = cart.reduce((sum, item) => sum + item.priceVND * item.qty, 0);

    const PAYMENT_OPTIONS = [
        {
            id: 'cash_vnd',
            icon: Banknote,
            label: lang === 'vi' ? 'Tiền mặt tại spa (VND)' : lang === 'cn' ? '现金支付 (VND)' : lang === 'jp' ? '現地現金払い (VND)' : lang === 'kr' ? '현장 현금 결제 (VND)' : 'Cash at Spa (VND)',
            desc: lang === 'vi' ? 'Thanh toán trực tiếp bằng VND khi đến quầy lễ tân' : 'Pay directly in cash at the reception desk',
        },
        {
            id: 'card',
            icon: CreditCard,
            label: lang === 'vi' ? 'Thẻ tín dụng / Ghi nợ' : lang === 'cn' ? '信用卡 / 借记卡' : lang === 'jp' ? 'クレジットカード / デビット' : lang === 'kr' ? '신용 / 체크카드' : 'Credit / Debit Card',
            desc: lang === 'vi' ? 'Hỗ trợ thẻ Visa, MasterCard, JCB, Napas qua máy POS' : 'Visa, MasterCard, JCB, Napas supported via POS',
        },
        {
            id: 'transfer',
            icon: QrCode,
            label: lang === 'vi' ? 'Chuyển khoản / VietQR' : lang === 'cn' ? '银行转账 / 二维码' : lang === 'jp' ? '銀行振込 / QRコード' : lang === 'kr' ? '계좌이체 / QR결제' : 'Bank Transfer / VietQR',
            desc: lang === 'vi' ? 'Quét mã VietQR chuyển khoản nhanh 24/7' : 'Scan VietQR code for 24/7 instant transfer',
        },
        {
            id: 'cash_usd',
            icon: DollarSign,
            label: lang === 'vi' ? 'Tiền mặt (USD)' : lang === 'cn' ? '美元现金 (USD)' : lang === 'jp' ? '米ドル現金 (USD)' : lang === 'kr' ? '미국 달러 현금 (USD)' : 'Cash (USD)',
            desc: lang === 'vi' ? 'Thanh toán bằng tiền mặt USD tại quầy thu ngân' : 'Pay in cash USD at the cashier desk',
        },
    ];

    const formatParts = (parts: string[]) => {
        if (parts.length >= 8) return dict.custom_for_you?.full_body || 'Full Body';
        return parts.map(p => dict.body_parts?.[p.toLowerCase()] || dict.body_parts?.[p] || p).join(', ');
    };

    const getSelectedPaymentLabel = () => {
        const opt = PAYMENT_OPTIONS.find(o => o.id === selectedPayment);
        return opt ? opt.label : dict.payment_methods?.[selectedPayment] || 'Tiền mặt tại spa';
    };

    const handleNextToStep2 = () => {
        if (!selectedPayment) {
            setAlertState({ isOpen: true, message: lang === 'vi' ? 'Vui lòng chọn phương thức thanh toán' : 'Please select a payment method', type: 'error' });
            return;
        }
        setCurrentStep(2);
    };

    const handleConfirmBooking = async () => {
        setIsSubmitting(true);
        try {
            const returnedId = await onConfirm({ paymentMethod: selectedPayment });
            if (returnedId) setBookingId(returnedId);
            setCurrentStep(3);
        } catch (error: any) {
            setAlertState({ isOpen: true, message: error?.message || 'Error sending order. Please try again.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnHome = () => {
        try {
            localStorage.removeItem('BOOKING_CART');
            localStorage.removeItem('booking_cart');
        } catch (e) { console.error('Error clearing cart cache', e); }
        window.location.href = `/${lang}`;
    };

    const toTitleCase = (str: string) => {
        if (!str) return '';
        return str.replace(/\b\w/g, char => char.toUpperCase());
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in pb-0 sm:pb-0 p-0 sm:p-4">
            <div
                className="bg-[#121124]/95 backdrop-blur-2xl border border-[#c9a96e]/25 w-full max-h-[92vh] md:max-h-[88vh] sm:rounded-[28px] rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 md:max-w-4xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header & Step Breadcrumbs */}
                <div className="pt-6 pb-4 flex flex-col items-center text-center px-6 border-b border-white/10 shrink-0 z-10 bg-transparent">
                    {/* Top Icon Badge */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#C9A96E] mb-2 bg-[#c9a96e]/10 border border-[#C9A96E]/30 shadow-[0_0_15px_rgba(201,169,110,0.2)]">
                        {currentStep === 1 && <Wallet size={22} strokeWidth={2.2} />}
                        {currentStep === 2 && <Check size={24} strokeWidth={3} />}
                        {currentStep === 3 && <Sparkles size={24} strokeWidth={2.2} />}
                    </div>

                    {/* Step Title */}
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                        {currentStep === 1 && (lang === 'vi' ? 'Phương thức thanh toán' : lang === 'cn' ? '选择付款方式' : lang === 'jp' ? 'お支払い方法の選択' : lang === 'kr' ? '결제 방법 선택' : 'Select Payment Method')}
                        {currentStep === 2 && (lang === 'vi' ? 'Xác nhận đặt lịch' : lang === 'cn' ? '确认预约' : lang === 'jp' ? 'ご予約の確認' : lang === 'kr' ? '예약 확인' : 'Confirm Booking')}
                        {currentStep === 3 && (lang === 'vi' ? 'Hoàn tất đặt lịch' : lang === 'cn' ? '预约完成' : lang === 'jp' ? 'ご予約完了' : lang === 'kr' ? '예약 완료' : 'Booking Complete')}
                    </h2>

                    {/* Step Subtitle / Note */}
                    <p className="text-xs md:text-sm text-[#e2be6f] mt-1 font-medium max-w-lg">
                        {currentStep === 1 && (
                            lang === 'vi'
                                ? 'Vui lòng chọn trước phương thức thanh toán khi bạn sử dụng dịch vụ.'
                                : lang === 'cn'
                                ? '使用服务前请预先选择付款方式。'
                                : lang === 'jp'
                                ? 'サービスをご利用になる前にお支払い方法をお選びください。'
                                : lang === 'kr'
                                ? '서비스를 이용하시기 전에 결제 방법을 미리 선택해 주시기 바랍니다.'
                                : 'Please select your payment method in advance before using our services.'
                        )}
                        {currentStep === 2 && (
                            lang === 'vi'
                                ? 'Kiểm tra lại trải nghiệm của bạn trước khi xác nhận.'
                                : lang === 'cn'
                                ? '请在确认前仔细检查您的预约体验。'
                                : lang === 'jp'
                                ? '確定前にもう一度体験内容をご確認ください。'
                                : lang === 'kr'
                                ? '확정하기 전에 예약 내용을 다시 확인해 주세요.'
                                : 'Review your experience details before final confirmation.'
                        )}
                        {currentStep === 3 && (
                            lang === 'vi'
                                ? 'Đơn đặt lịch của bạn đã được ghi nhận vào hệ thống.'
                                : lang === 'cn'
                                ? '您的预约已成功记录至系统。'
                                : lang === 'jp'
                                ? 'ご予約がシステムに正常に登録されました。'
                                : lang === 'kr'
                                ? '예약이 시스템에 성공적으로 접수되었습니다.'
                                : 'Your booking has been successfully recorded in the system.'
                        )}
                    </p>

                    {/* Step Breadcrumbs Indicator */}
                    <div className="flex items-center justify-center gap-2 sm:gap-4 mt-3 text-xs">
                        {/* Step 1 */}
                        <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-[#f2d58d]' : 'text-gray-500'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${currentStep === 1 ? 'bg-[#c9a96e] text-black' : currentStep > 1 ? 'bg-[#c9a96e]/20 text-[#f2d58d] border border-[#c9a96e]/40' : 'bg-white/10 text-gray-400'}`}>
                                {currentStep > 1 ? '✓' : '01'}
                            </span>
                            <span className="font-medium text-[11px] sm:text-xs">
                                {lang === 'vi' ? 'Thanh toán' : 'Payment'}
                            </span>
                        </div>

                        <div className={`w-6 sm:w-12 h-[1px] ${currentStep >= 2 ? 'bg-[#c9a96e]/60' : 'bg-white/10'}`} />

                        {/* Step 2 */}
                        <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-[#f2d58d]' : 'text-gray-500'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${currentStep === 2 ? 'bg-[#c9a96e] text-black' : currentStep > 2 ? 'bg-[#c9a96e]/20 text-[#f2d58d] border border-[#c9a96e]/40' : 'bg-white/10 text-gray-400'}`}>
                                {currentStep > 2 ? '✓' : '02'}
                            </span>
                            <span className="font-medium text-[11px] sm:text-xs">
                                {lang === 'vi' ? 'Xem lại' : 'Review'}
                            </span>
                        </div>

                        <div className={`w-6 sm:w-12 h-[1px] ${currentStep >= 3 ? 'bg-[#c9a96e]/60' : 'bg-white/10'}`} />

                        {/* Step 3 */}
                        <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-[#f2d58d]' : 'text-gray-500'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${currentStep === 3 ? 'bg-[#c9a96e] text-black' : 'bg-white/10 text-gray-400'}`}>
                                {currentStep === 3 ? '✓' : '03'}
                            </span>
                            <span className="font-medium text-[11px] sm:text-xs">
                                {lang === 'vi' ? 'Hoàn tất' : 'Complete'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar min-h-0">
                    
                    {/* ================= STEP 1: PAYMENT METHOD SELECTION ================= */}
                    {currentStep === 1 && (
                        <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                {PAYMENT_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = selectedPayment === option.id;
                                    return (
                                        <div
                                            key={option.id}
                                            onClick={() => setSelectedPayment(option.id)}
                                            className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border flex flex-col justify-between relative group ${
                                                isSelected
                                                    ? 'border-[#C9A96E] bg-[#C9A96E]/10 shadow-[0_0_20px_rgba(201,169,110,0.18)]'
                                                    : 'border-white/10 bg-white/[0.02] hover:border-[#C9A96E]/40 hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                                    isSelected ? 'bg-[#c9a96e] text-black' : 'bg-white/5 text-[#f2d58d] border border-white/10'
                                                }`}>
                                                    <Icon size={20} strokeWidth={2.2} />
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                                    isSelected ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-white/20 bg-transparent'
                                                }`}>
                                                    {isSelected && <Check size={12} className="text-black" strokeWidth={3.5} />}
                                                </div>
                                            </div>

                                            <div>
                                                <div className={`font-bold text-sm mb-1 transition-colors ${isSelected ? 'text-[#f2d58d]' : 'text-white'}`}>
                                                    {option.label}
                                                </div>
                                                <div className="text-xs text-gray-400 leading-relaxed font-light">
                                                    {option.desc}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Step 1 Footer Actions */}
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold uppercase text-xs tracking-wider hover:bg-white/5 transition-colors active:scale-[0.98]"
                                >
                                    {dict.checkout?.cancel || 'Hủy bỏ'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextToStep2}
                                    className="flex-[1.5] bg-gradient-to-r from-[#ecd38f] to-[#c6a55f] text-[#2c2416] py-3 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg hover:brightness-105 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                                >
                                    <span>{lang === 'vi' ? 'Tiếp tục' : 'Next'}</span>
                                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 2: REVIEW & CONFIRM CHECKOUT ================= */}
                    {currentStep === 2 && (
                        <div className="animate-in fade-in duration-300 space-y-6">
                            <div className="md:grid md:grid-cols-12 md:gap-6 space-y-6 md:space-y-0">
                                
                                {/* LEFT COLUMN: THÔNG TIN LỊCH HẸN (With Edit capability) */}
                                <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-[#C9A96E]" />
                                                <span className="text-[11px] font-bold text-[#C9A96E] uppercase tracking-wider">
                                                    {lang === 'vi' ? 'THÔNG TIN LỊCH HẸN' : 'BOOKING SCHEDULE'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (onEditCustomerInfo) onEditCustomerInfo();
                                                    else onClose();
                                                }}
                                                className="text-gray-400 hover:text-[#f2d58d] flex items-center gap-1 text-[11px] transition-colors group"
                                                title={lang === 'vi' ? 'Chỉnh sửa thông tin đặt hẹn' : 'Edit booking details'}
                                            >
                                                <Edit3 size={12} className="group-hover:scale-110 transition-transform" />
                                                <span className="underline font-light">{lang === 'vi' ? 'Sửa' : 'Edit'}</span>
                                            </button>
                                        </div>

                                        <div className="space-y-2 text-xs md:text-sm">
                                            {bookingDate && (
                                                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                    <span className="text-gray-400">{lang === 'vi' ? 'Ngày hẹn' : 'Date'}</span>
                                                    <span className="font-bold text-[#f2d58d]">{bookingDate}</span>
                                                </div>
                                            )}
                                            {bookingTime && (
                                                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                    <span className="text-gray-400">{lang === 'vi' ? 'Giờ hẹn' : 'Time'}</span>
                                                    <span className="font-bold text-[#f2d58d]">{bookingTime}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                <span className="text-gray-400">{lang === 'vi' ? 'Số lượng khách' : 'Guests'}</span>
                                                <span className="font-bold text-[#f2d58d]">{guestCount} {lang === 'vi' ? 'khách' : 'guest(s)'}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                <span className="text-gray-400">{dict.checkout?.name || 'Họ và tên'}</span>
                                                <span className="font-bold text-white">{customerInfo.name || 'Guest'}</span>
                                            </div>
                                            {customerInfo.email && (
                                                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                    <span className="text-gray-400">{dict.checkout?.email_label || 'Email'}</span>
                                                    <span className="font-bold text-white truncate max-w-[170px]">{customerInfo.email}</span>
                                                </div>
                                            )}
                                            {customerInfo.phone && (
                                                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                    <span className="text-gray-400">{dict.checkout?.phone_label || 'Số điện thoại'}</span>
                                                    <span className="font-bold text-white">{customerInfo.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Official Spa Info Block */}
                                    <div className="pt-3 border-t border-white/10 space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <SmartLogo theme="dark" className="h-7 w-auto object-contain" />
                                        </div>
                                        <div className="space-y-1.5 text-xs text-gray-300">
                                            <div className="flex items-start gap-2">
                                                <MapPin size={13} className="text-[#C9A96E] shrink-0 mt-0.5" />
                                                <span className="leading-snug text-[11px] text-gray-300">11 Ngô Đức Kế, P. Bến Nghé, Q.1, TP.HCM</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={13} className="text-[#C9A96E] shrink-0" />
                                                <a href="tel:+84964090277" className="text-[11px] text-[#f2d58d] font-medium hover:underline">(+84) 964 090 277</a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail size={13} className="text-[#C9A96E] shrink-0" />
                                                <span className="text-[11px] text-gray-300">contact@oriaspa.com</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: TRẢI NGHIỆM CỦA BẠN (With individual edit buttons) */}
                                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                                            <div className="flex items-center gap-2">
                                                <Sparkles size={14} className="text-[#C9A96E]" />
                                                <span className="text-[11px] font-bold text-[#C9A96E] uppercase tracking-wider">
                                                    {lang === 'vi' ? 'TRẢI NGHIỆM CỦA BẠN' : 'YOUR EXPERIENCE'}
                                                </span>
                                            </div>
                                            <span className="bg-[#c9a96e]/15 text-[#f2d58d] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#c9a96e]/30">
                                                {cart.length} {dict.checkout?.items || 'dịch vụ'}
                                            </span>
                                        </div>

                                        {/* Services List with sleek cards and Edit buttons */}
                                        <div className="space-y-3 max-h-[220px] md:max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                                            {cart.map((item, idx) => {
                                                const strength = item.options?.strength;
                                                const therapist = item.options?.therapist;
                                                const focus = item.options?.bodyParts?.focus || [];

                                                return (
                                                    <div 
                                                        key={item.cartId || idx} 
                                                        className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-[#c9a96e]/30 transition-all space-y-2 relative group"
                                                    >
                                                        {/* Top Title & Edit */}
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="flex-1 pr-2">
                                                                <span className="font-bold text-white text-sm">
                                                                    {toTitleCase(item.names?.[lang] || item.names?.en || 'Dịch vụ Spa')}
                                                                </span>
                                                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={12} className="text-gray-400" />
                                                                        {item.timeValue || item.timeDisplay} {dict.checkout?.mins || 'phút'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                                <span className="font-bold text-[#f2d58d] text-sm">
                                                                    {formatCurrency(item.priceVND * item.qty)} VND
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (onEditService) onEditService(item);
                                                                        else onClose();
                                                                    }}
                                                                    className="text-gray-400 hover:text-[#f2d58d] flex items-center gap-1 text-[10px] transition-colors"
                                                                    title={lang === 'vi' ? 'Chỉnh sửa dịch vụ này' : 'Edit this service'}
                                                                >
                                                                    <Edit3 size={11} />
                                                                    <span>{lang === 'vi' ? 'Sửa' : 'Edit'}</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Customization badges */}
                                                        {(strength || therapist || focus.length > 0) && (
                                                            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-white/[0.04] text-[11px]">
                                                                {strength && (
                                                                    <span className="bg-white/5 px-2 py-0.5 rounded-md text-gray-300 border border-white/5">
                                                                        {dict.custom_for_you?.strength_label || 'Lực'}: <strong className="text-[#f2d58d] capitalize">{strength}</strong>
                                                                    </span>
                                                                )}
                                                                {therapist && (
                                                                    <span className="bg-white/5 px-2 py-0.5 rounded-md text-gray-300 border border-white/5">
                                                                        {dict.custom_for_you?.therapist_gender || 'KTV'}: <strong className="text-[#f2d58d] capitalize">{therapist}</strong>
                                                                    </span>
                                                                )}
                                                                {focus.length > 0 && (
                                                                    <span className="bg-white/5 px-2 py-0.5 rounded-md text-gray-300 border border-white/5">
                                                                        {dict.custom_for_you?.focus_areas || 'Tập trung'}: <strong className="text-[#f2d58d]">{formatParts(focus)}</strong>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row Summary: Payment Method & Total Bill */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-white/10">
                                {/* Selected Payment Method Card with Change Option */}
                                <div 
                                    onClick={() => setCurrentStep(1)}
                                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#c9a96e]/40 transition-colors flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/30 flex items-center justify-center text-[#f2d58d]">
                                            <Wallet size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {dict.checkout?.payment_method || 'Phương thức thanh toán'}
                                            </div>
                                            <div className="text-xs sm:text-sm font-bold text-[#f2d58d]">
                                                {getSelectedPaymentLabel()}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-gray-400 group-hover:text-[#f2d58d] flex items-center gap-1 text-[11px] transition-colors"
                                    >
                                        <Edit3 size={12} />
                                        <span className="underline font-light">{lang === 'vi' ? 'Đổi' : 'Change'}</span>
                                    </button>
                                </div>

                                {/* Total Bill Card */}
                                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/30 flex items-center justify-center text-[#f2d58d]">
                                            <Receipt size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {dict.checkout?.total_bill || 'Tổng tiền'}
                                            </div>
                                            <div className="text-base sm:text-lg font-bold text-[#f2d58d]">
                                                {formatCurrency(totalVND)} VND
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 Footer Buttons (Back & Submit) */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    id="modal-step2-back-btn"
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold uppercase text-xs tracking-wider hover:bg-white/5 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 group"
                                >
                                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                    <span>{lang === 'vi' ? 'Quay lại' : 'Back'}</span>
                                </button>
                                <button
                                    id="modal-step2-confirm-btn"
                                    type="button"
                                    onClick={handleConfirmBooking}
                                    disabled={isSubmitting}
                                    className="flex-[1.5] bg-gradient-to-r from-[#ecd38f] to-[#c6a55f] text-[#2c2416] py-3 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg hover:brightness-105 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                                >
                                    <span>{isSubmitting ? (lang === 'vi' ? 'Đang gửi...' : 'Processing...') : (dict.checkout?.submit || 'Xác nhận đặt lịch')}</span>
                                    {!isSubmitting && <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 3: MINIMALIST SUCCESS & THANK YOU SCREEN ================= */}
                    {currentStep === 3 && (
                        <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-5 py-4 sm:py-6 animate-in zoom-in-95 duration-300">
                            {/* Big Glowing Gold Checkmark */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#c9a96e]/25 to-black/40 rounded-full flex items-center justify-center border-2 border-[#C9A96E]/50 shadow-[0_0_30px_rgba(201,169,110,0.3)]">
                                <Check size={36} className="text-[#f2d58d]" strokeWidth={3.5} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                                    {lang === 'vi' ? '🎉 Đặt lịch thành công!' : lang === 'cn' ? '🎉 预约成功！' : lang === 'jp' ? '🎉 ご予約が完了しました！' : lang === 'kr' ? '🎉 예약이 완료되었습니다!' : '🎉 Booking Successful!'}
                                </h3>

                                {bookingId && (
                                    <div className="inline-flex items-center gap-1.5 bg-[#c9a96e]/15 border border-[#c9a96e]/30 px-3.5 py-1 rounded-full text-xs font-mono text-[#f2d58d] font-bold">
                                        <span>{lang === 'vi' ? 'Mã đơn:' : 'Order ID:'}</span>
                                        <span>#{bookingId}</span>
                                    </div>
                                )}

                                <p className="text-xs md:text-sm text-[#e2be6f] font-medium pt-1 max-w-sm mx-auto">
                                    {lang === 'vi' 
                                        ? 'Chúng tôi đang trong quá trình xử lý đơn của bạn, vui lòng đợi 1 tí nhé ✨' 
                                        : lang === 'cn' 
                                        ? '我们正在处理您的订单，请稍候片刻 ✨' 
                                        : lang === 'jp' 
                                        ? '現在リクエストを処理中です。少々お待ちください ✨' 
                                        : lang === 'kr' 
                                        ? '고객님의 예약을 처리 중입니다. 잠시만 기다려 주세요 ✨' 
                                        : 'We are processing your booking, please wait a moment ✨'}
                                </p>
                            </div>

                            {/* Tablet Mode Extra (QR code if registered tablet) */}
                            {isTabletDevice && bookingId && (
                                <div className="bg-white p-4 rounded-2xl shadow-xl">
                                    <QRCodeSVG
                                        value={`${typeof window !== 'undefined' ? window.location.origin : UI_CONFIG.JOURNEY_BASE_URL}/${lang}/journey/${bookingId}`}
                                        size={UI_CONFIG.QR_SIZE}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                            )}

                            {/* Single Action: Return to Home (Clears cart cache) */}
                            <div className="w-full pt-4">
                                <button
                                    id="modal-step3-return-home-btn"
                                    type="button"
                                    onClick={handleReturnHome}
                                    className="w-full bg-gradient-to-r from-[#ecd38f] to-[#c6a55f] text-[#2c2416] py-3.5 rounded-2xl font-bold uppercase text-xs tracking-wider shadow-lg hover:brightness-105 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                                >
                                    <span>{lang === 'vi' ? 'Quay về trang chủ' : 'Return to Home'}</span>
                                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Alert Modal Overlay */}
            <AlertModal
                isOpen={alertState.isOpen}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                lang={lang}
            />
        </div>
    );
}

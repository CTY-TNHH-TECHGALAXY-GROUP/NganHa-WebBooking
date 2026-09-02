'use client';

import React, { useEffect, useState } from 'react';
import { 
    X, 
    Clock, 
    ArrowRight, 
    Check, 
    Edit3, 
    CreditCard, 
    Banknote, 
    QrCode, 
    DollarSign, 
    Receipt, 
    Calendar, 
    Info,
    ArrowRightLeft,
    Hand,
    User,
    Target,
    ShieldOff,
    Heart,
    AlertTriangle,
    FileText,
    Sparkles,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import SmartLogo from '@/components/SmartLogo';
import { CartItem } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';
import { createClient } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import AlertModal from '@/components/Shared/AlertModal';
import { VND_DENOMINATIONS, USD_INFO, ACCEPTED_CARDS } from '@/lib/paymentConstants';
import { clearBookingCart } from '@/lib/bookingCartStorage';

const UI_CONFIG = {
    MODAL_MAX_WIDTH: '880px',
    TABLET_RESET_SECONDS: 180,
    QR_SIZE: 180,
    JOURNEY_BASE_URL: 'https://nganha.vercel.app',
};

interface OrderConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { 
        paymentMethod: string;
        customerInfo?: { name: string; email: string; phone: string; gender: string };
        guestCount?: number;
        bookingDate?: string;
        bookingTime?: string;
    }) => Promise<string | null>;
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
    customerInfo: initialCustomerInfo,
    paymentMethod = 'cash_vnd',
    guestCount: initialGuestCount = 1,
    bookingDate: initialBookingDate,
    bookingTime: initialBookingTime,
    onEditService,
}: OrderConfirmModalProps) {
    const [currentStep, setCurrentStep] = useState<2 | 3>(2);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [isTabletDevice, setIsTabletDevice] = useState(false);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });

    // Inline edit state on popover
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [localName, setLocalName] = useState(initialCustomerInfo?.name || '');
    const [localEmail, setLocalEmail] = useState(initialCustomerInfo?.email || '');
    const [localPhone, setLocalPhone] = useState(initialCustomerInfo?.phone || '');
    const [localGuests, setLocalGuests] = useState(initialGuestCount);
    const [localDate, setLocalDate] = useState(initialBookingDate || '');
    const [localTime, setLocalTime] = useState(initialBookingTime || '');

    // Payment method info popup
    const [activeMethodId, setActiveMethodId] = useState<string | null>(null);

    // Track expanded state for service customizations
    const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

    const toggleExpand = (idx: number) => {
        setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(2);
            setIsEditingSchedule(false);
            setLocalName(initialCustomerInfo?.name || '');
            setLocalEmail(initialCustomerInfo?.email || '');
            setLocalPhone(initialCustomerInfo?.phone || '');
            setLocalGuests(initialGuestCount);
            setLocalDate(initialBookingDate || '');
            setLocalTime(initialBookingTime || '');
        }
    }, [isOpen, initialCustomerInfo, initialGuestCount, initialBookingDate, initialBookingTime]);

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

    const PAYMENT_METHODS_ACCEPTED = [
        {
            id: 'cash_vnd',
            icon: Banknote,
            label: lang === 'vi' ? 'Tiền mặt (VND)' : lang === 'cn' ? '现金支付 (VND)' : lang === 'jp' ? '現地現金払い (VND)' : lang === 'kr' ? '현장 현금 결제 (VND)' : 'Cash (VND)',
            desc: lang === 'vi' ? 'Thanh toán trực tiếp bằng VND khi đến quầy lễ tân' : 'Pay directly in cash at the reception desk',
        },
        {
            id: 'cash_usd',
            icon: DollarSign,
            label: lang === 'vi' ? 'Tiền mặt (USD)' : lang === 'cn' ? '美元现金 (USD)' : lang === 'jp' ? '米ドル現金 (USD)' : lang === 'kr' ? '미국 달러 현금 (USD)' : 'Cash (USD)',
            desc: lang === 'vi' ? 'Thanh toán bằng tiền mặt USD tại quầy thu ngân' : 'Pay in cash USD at the cashier desk',
        },
        {
            id: 'card',
            icon: CreditCard,
            label: lang === 'vi' ? 'Thẻ POS / Visa' : lang === 'cn' ? '信用卡 / 借记卡' : lang === 'jp' ? 'クレジットカード' : lang === 'kr' ? '신용 / 체크카드' : 'Credit / POS Card',
            desc: lang === 'vi' ? 'Hỗ trợ thẻ Visa, MasterCard, JCB, Napas qua máy POS' : 'Visa, MasterCard, JCB, Napas supported via POS',
        },
        {
            id: 'transfer',
            icon: QrCode,
            label: lang === 'vi' ? 'VietQR / CK' : lang === 'cn' ? '银行转账 / 二维码' : lang === 'jp' ? '銀行振込 / QRコード' : lang === 'kr' ? '계좌이체 / QR결제' : 'VietQR Transfer',
            desc: 'Chúng tôi hỗ trợ international transfer, domestic transfer',
        },
    ];

    const formatParts = (parts: string[]) => {
        if (!parts || parts.length === 0) return '';
        if (parts.length >= 8) return dict.custom_for_you?.full_body || 'Full Body';
        return parts.map(p => dict.body_parts?.[p.toLowerCase()] || dict.body_parts?.[p] || p).join(', ');
    };

    const handleConfirmBooking = async () => {
        if (cart.length === 0) {
            setAlertState({ isOpen: true, message: lang === 'vi' ? 'Vui lòng chọn ít nhất 1 dịch vụ' : 'Please select at least 1 service', type: 'error' });
            return;
        }
        if (!localName.trim()) {
            setAlertState({ isOpen: true, message: dict.checkout?.alerts?.fill_name || 'Please enter your Full Name', type: 'error' });
            return;
        }
        if (!localEmail.trim() && !localPhone.trim()) {
            setAlertState({ isOpen: true, message: dict.checkout?.alerts?.fill_phone_or_email || 'Please enter Phone Number or Email', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const returnedId = await onConfirm({ 
                paymentMethod,
                customerInfo: {
                    ...initialCustomerInfo,
                    name: localName.trim(),
                    email: localEmail.trim(),
                    phone: localPhone.trim(),
                },
                guestCount: localGuests,
                bookingDate: localDate,
                bookingTime: localTime,
            });
            if (returnedId) setBookingId(returnedId);
            clearBookingCart();
            setCurrentStep(3);
        } catch (error: any) {
            setAlertState({ isOpen: true, message: error?.message || 'Error sending order. Please try again.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnHome = () => {
        clearBookingCart();
        onClose();
        window.location.href = '/';
    };

    return (
        <div 
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in pb-0 sm:pb-0 p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-black/60 backdrop-blur-3xl border border-[#c9a96e]/30 w-full max-h-[92vh] md:max-h-[88vh] sm:rounded-[28px] rounded-t-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 md:max-w-4xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Center Top Brand Header */}
                <div className="pt-6 pb-4 flex flex-col items-center text-center px-6 border-b border-white/10 shrink-0 z-10 bg-transparent">
                    {/* Official SmartLogo at Center Top */}
                    <div className="flex flex-col items-center mb-2">
                        <SmartLogo theme="dark" className="h-9 md:h-11 w-auto object-contain drop-shadow-md" />
                        <span className="text-[9px] tracking-[0.25em] text-[#c9a96e]/80 uppercase mt-1 font-medium">
                            by TECHGALAXY GROUP
                        </span>
                    </div>

                    {/* Step Title & Subtitle (Only for Step 2 to avoid duplicate in Step 3) */}
                    {currentStep === 2 && (
                        <>
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide mt-1">
                                {lang === 'vi' ? 'Xác nhận đặt lịch' : lang === 'cn' ? '确认预约' : lang === 'jp' ? 'ご予約の確認' : lang === 'kr' ? '예약 확인' : 'Confirm Booking'}
                            </h2>
                            <p className="text-xs md:text-sm text-[#e2be6f] mt-1 font-medium max-w-lg">
                                {lang === 'vi'
                                    ? 'Kiểm tra lại thông tin trải nghiệm của bạn trước khi gửi.'
                                    : lang === 'cn'
                                    ? '请在确认前仔细检查您的预约体验。'
                                    : lang === 'jp'
                                    ? '確定前にもう一度体験内容をご確認ください。'
                                    : lang === 'kr'
                                    ? '확정하기 전에 예약 내용을 다시 확인해 주세요.'
                                    : 'Review your experience details before final confirmation.'}
                            </p>
                        </>
                    )}
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar min-h-0">
                    
                    {/* ================= STEP 2: REVIEW & CONFIRM CHECKOUT ================= */}
                    {currentStep === 2 && (
                        <div className="animate-in fade-in duration-300 space-y-6">
                            <div className="md:grid md:grid-cols-12 md:gap-6 space-y-6 md:space-y-0">
                                
                                {/* LEFT COLUMN: THÔNG TIN LỊCH HẸN (With direct inline editing on popover) */}
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
                                                onClick={() => setIsEditingSchedule(!isEditingSchedule)}
                                                className="text-gray-400 hover:text-[#f2d58d] flex items-center gap-1 text-[11px] transition-colors group cursor-pointer"
                                                title={lang === 'vi' ? 'Chỉnh sửa trực tiếp trên popover' : 'Edit details directly'}
                                            >
                                                <Edit3 size={12} className="group-hover:scale-110 transition-transform" />
                                                <span className="underline font-light">
                                                    {isEditingSchedule ? (lang === 'vi' ? 'Xong' : 'Done') : (lang === 'vi' ? 'Sửa' : 'Edit')}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Inline Editable Form vs Display Summary */}
                                        {isEditingSchedule ? (
                                            <div className="space-y-2.5 p-3 rounded-2xl bg-white/[0.03] border border-[#c9a96e]/30 animate-in fade-in duration-200">
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase font-medium">{dict.checkout?.name || 'Họ và tên'}</label>
                                                    <input
                                                        type="text"
                                                        value={localName}
                                                        onChange={(e) => setLocalName(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#c9a96e] outline-none mt-0.5"
                                                        placeholder="Họ và tên"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 uppercase font-medium">Email</label>
                                                        <input
                                                            type="email"
                                                            value={localEmail}
                                                            onChange={(e) => setLocalEmail(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#c9a96e] outline-none mt-0.5"
                                                            placeholder="Email"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-400 uppercase font-medium">Số điện thoại</label>
                                                        <input
                                                            type="tel"
                                                            value={localPhone}
                                                            onChange={(e) => setLocalPhone(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#c9a96e] outline-none mt-0.5"
                                                            placeholder="Phone"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[11px] text-gray-400">{lang === 'vi' ? 'Số khách:' : 'Guests:'}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setLocalGuests(prev => Math.max(1, prev - 1))}
                                                            className="w-6 h-6 rounded bg-white/10 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-xs font-bold text-[#f2d58d] min-w-[16px] text-center">{localGuests}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setLocalGuests(prev => Math.min(20, prev + 1))}
                                                            className="w-6 h-6 rounded bg-[#c9a96e]/30 text-[#f2d58d] flex items-center justify-center text-xs font-bold cursor-pointer"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingSchedule(false)}
                                                    className="w-full py-1.5 bg-[#c9a96e]/20 border border-[#c9a96e]/40 rounded-lg text-xs font-bold text-[#f2d58d] mt-1 hover:bg-[#c9a96e]/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <Check size={12} />
                                                    <span>{lang === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 text-xs md:text-sm">
                                                {localDate && (
                                                    <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                        <span className="text-gray-400">{lang === 'vi' ? 'Ngày hẹn' : 'Date'}</span>
                                                        <span className="font-bold text-[#f2d58d]">{localDate}</span>
                                                    </div>
                                                )}
                                                {localTime && (
                                                    <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                        <span className="text-gray-400">{lang === 'vi' ? 'Giờ hẹn' : 'Time'}</span>
                                                        <span className="font-bold text-[#f2d58d]">{localTime}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                    <span className="text-gray-400">{lang === 'vi' ? 'Số lượng khách' : 'Guests'}</span>
                                                    <span className="font-bold text-[#f2d58d]">{localGuests} {lang === 'vi' ? 'khách' : 'guest(s)'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                    <span className="text-gray-400">{dict.checkout?.name || 'Họ và tên'}</span>
                                                    <span className="font-bold text-white">{localName || 'Guest'}</span>
                                                </div>
                                                {localEmail && (
                                                    <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                        <span className="text-gray-400">{dict.checkout?.email_label || 'Email'}</span>
                                                        <span className="font-bold text-white truncate max-w-[170px]">{localEmail}</span>
                                                    </div>
                                                )}
                                                {localPhone && (
                                                    <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                                                        <span className="text-gray-400">{dict.checkout?.phone_label || 'Số điện thoại'}</span>
                                                        <span className="font-bold text-white">{localPhone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: TRẢI NGHIỆM CỦA BẠN (With All Custom Badges & Notes) */}
                                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-[#C9A96E] uppercase tracking-wider">
                                                    {lang === 'vi' ? 'TRẢI NGHIỆM CỦA BẠN' : 'YOUR EXPERIENCE'}
                                                </span>
                                            </div>
                                            <span className="bg-[#c9a96e]/15 text-[#f2d58d] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#c9a96e]/30">
                                                {cart.length} {dict.checkout?.items || 'dịch vụ'}
                                            </span>
                                        </div>

                                        {/* Services List with comprehensive customization badges */}
                                        <div className="space-y-2.5 max-h-[240px] md:max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                            {cart.map((item, idx) => {
                                                const strength = item.options?.strength;
                                                const therapist = item.options?.therapist;
                                                const focus = item.options?.bodyParts?.focus || [];
                                                const avoid = item.options?.bodyParts?.avoid || [];
                                                const isPregnant = item.options?.notes?.tag0;
                                                const isAllergy = item.options?.notes?.tag1;
                                                const noteContent = item.options?.notes?.content?.trim();
                                                const hasPrivateRoom = item.options?.addons?.privateRoom;

                                                const hasCustomizations = 
                                                    strength || 
                                                    therapist || 
                                                    focus.length > 0 || 
                                                    avoid.length > 0 || 
                                                    isPregnant || 
                                                    isAllergy || 
                                                    noteContent || 
                                                    hasPrivateRoom;

                                                return (
                                                    <div 
                                                        key={item.cartId || idx} 
                                                        className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-[#c9a96e]/30 transition-all space-y-1.5 relative group"
                                                    >
                                                        {/* Top Title & Edit */}
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="flex-1 pr-2">
                                                                <span className="font-bold text-white text-sm capitalize">
                                                                    {item.names?.[lang] || item.names?.en || 'Dịch vụ Spa'}
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
                                                                    }}
                                                                    className="text-gray-400 hover:text-[#f2d58d] flex items-center gap-1 text-[10px] transition-colors cursor-pointer"
                                                                    title={lang === 'vi' ? 'Chỉnh sửa dịch vụ này' : 'Edit this service'}
                                                                >
                                                                    <Edit3 size={11} />
                                                                    <span>{lang === 'vi' ? 'Sửa' : 'Edit'}</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* All Customization badges: Strength, Therapist, Focus, Avoid, Pregnancy, Allergy, Note, Addon */}
                                                        {hasCustomizations && (
                                                            <>
                                                                {!expandedItems[idx] ? (
                                                                    <div className="pt-1 mt-1 border-t border-white/[0.04]">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleExpand(idx)}
                                                                            className="w-full py-1.5 flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-[#c9a96e] transition-colors cursor-pointer"
                                                                        >
                                                                            <span>{lang === 'vi' ? 'Xem thêm chi tiết' : 'See details'}</span>
                                                                            <ChevronDown size={12} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="pt-2 mt-2 border-t border-white/[0.04] text-[11px] space-y-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                                                                        {strength && (
                                                                            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <Hand size={13} />
                                                                                    <span>{dict.custom_for_you?.strength_label || 'Lực'}</span>
                                                                                </div>
                                                                                <span className="text-[#f2d58d] font-bold capitalize">{strength}</span>
                                                                            </div>
                                                                        )}
                                                                        {therapist && (
                                                                            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <User size={13} />
                                                                                    <span>{dict.custom_for_you?.therapist_gender || 'KTV'}</span>
                                                                                </div>
                                                                                <span className="text-[#f2d58d] font-bold capitalize">{therapist}</span>
                                                                            </div>
                                                                        )}
                                                                        {focus.length > 0 && (
                                                                            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <Target size={13} />
                                                                                    <span>{dict.custom_for_you?.focus_areas || 'Tập trung'}</span>
                                                                                </div>
                                                                                <span className="text-[#f2d58d] font-bold truncate ml-2 max-w-[150px] text-right">{formatParts(focus)}</span>
                                                                            </div>
                                                                        )}
                                                                        {avoid.length > 0 && (
                                                                            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <ShieldOff size={13} />
                                                                                    <span>{dict.custom_for_you?.avoid_areas || (lang === 'vi' ? 'Tránh' : 'Avoid')}</span>
                                                                                </div>
                                                                                <span className="text-[#f2d58d] font-bold truncate ml-2 max-w-[150px] text-right">{formatParts(avoid)}</span>
                                                                            </div>
                                                                        )}
                                                                        {hasPrivateRoom && (
                                                                            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <Sparkles size={13} />
                                                                                    <span>{dict.custom_for_you?.private_room || (lang === 'vi' ? 'Phòng riêng' : 'Private Room')}</span>
                                                                                </div>
                                                                                <span className="text-[#f2d58d] font-bold">+105K</span>
                                                                            </div>
                                                                        )}
                                                                        {isPregnant && (
                                                                            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <Heart size={13} />
                                                                                    <span>{dict.tags?.pregnant || (lang === 'vi' ? 'Mang thai' : 'Pregnant')}</span>
                                                                                </div>
                                                                                <span className="text-[#f2d58d] font-bold">{lang === 'vi' ? 'Có' : 'Yes'}</span>
                                                                            </div>
                                                                        )}
                                                                        {isAllergy && (
                                                                            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <AlertTriangle size={13} />
                                                                                    <span>{dict.tags?.allergy || (lang === 'vi' ? 'Dị ứng' : 'Allergy')}</span>
                                                                                </div>
                                                                                <span className="text-[#f2d58d] font-bold">{lang === 'vi' ? 'Có' : 'Yes'}</span>
                                                                            </div>
                                                                        )}
                                                                        {noteContent && (
                                                                            <div className="flex justify-between items-start bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                                                                                <div className="flex items-center gap-2 text-gray-400 mt-0.5">
                                                                                    <FileText size={13} />
                                                                                    <span>{dict.checkout?.note || 'Ghi chú'}</span>
                                                                                </div>
                                                                                <span className="text-white italic max-w-[150px] text-right line-clamp-2 ml-2 leading-tight">&quot;{noteContent}&quot;</span>
                                                                            </div>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleExpand(idx)}
                                                                            className="w-full py-1 mt-1 flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-[#c9a96e] transition-colors cursor-pointer"
                                                                        >
                                                                            <span>{lang === 'vi' ? 'Thu gọn' : 'Show less'}</span>
                                                                            <ChevronUp size={12} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row Summary: We accept payment methods + Total Bill */}
                            <div className="pt-4 border-t border-white/10 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                                    
                                    {/* Left: We accept payment methods badge list */}
                                    <div className="md:col-span-7 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#c9a96e] uppercase tracking-wider">
                                            <Info size={13} />
                                            <span>
                                                {lang === 'vi' ? 'Phương thức thanh toán chấp nhận:' : 'We accept payment methods:'}
                                            </span>
                                        </div>

                                        {/* Informational Payment Chips (Click opens rich info popover) */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {PAYMENT_METHODS_ACCEPTED.map((method) => {
                                                const Icon = method.icon;
                                                return (
                                                    <div
                                                        key={method.id}
                                                        id={`payment-chip-${method.id}`}
                                                        onClick={() => setActiveMethodId(method.id)}
                                                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-[#c9a96e]/10 border border-white/5 hover:border-[#c9a96e]/40 transition-all cursor-pointer flex flex-col items-center text-center gap-1 group"
                                                        title="Bấm để xem chi tiết / Click for details"
                                                    >
                                                        <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-[#c9a96e]/20 flex items-center justify-center text-[#f2d58d] transition-colors">
                                                            <Icon size={14} />
                                                        </div>
                                                        <span className="text-[11px] font-medium text-gray-300 group-hover:text-white leading-tight">
                                                            {method.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Right: Total Bill Card */}
                                    <div className="md:col-span-5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
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
                            </div>

                            {/* Step 2 Footer Buttons (Cancel & Submit) */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    id="modal-step2-cancel-btn"
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold uppercase text-xs tracking-wider hover:bg-white/5 transition-colors active:scale-[0.98] cursor-pointer"
                                >
                                    {dict.checkout?.cancel || 'Hủy bỏ'}
                                </button>
                                <button
                                    id="modal-step2-confirm-btn"
                                    type="button"
                                    onClick={handleConfirmBooking}
                                    disabled={isSubmitting}
                                    className="flex-[1.5] bg-gradient-to-r from-[#ecd38f] to-[#c6a55f] text-[#2c2416] py-3 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg hover:brightness-105 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    <span>{isSubmitting ? (lang === 'vi' ? 'Đang gửi...' : 'Processing...') : (dict.checkout?.submit || 'Xác nhận đặt lịch')}</span>
                                    {!isSubmitting && <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 3: MINIMALIST SUCCESS & THANK YOU SCREEN ================= */}
                    {currentStep === 3 && (
                        <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-5 py-6 animate-in zoom-in-95 duration-300">
                            {/* Big Glowing Gold Checkmark */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#c9a96e]/25 to-black/40 rounded-full flex items-center justify-center border-2 border-[#C9A96E]/50 shadow-[0_0_30px_rgba(201,169,110,0.3)]">
                                <Check size={36} className="text-[#f2d58d]" strokeWidth={3.5} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                                    {lang === 'vi' ? 'Đặt lịch thành công!' : lang === 'cn' ? '预约成功！' : lang === 'jp' ? 'ご予約が完了しました！' : lang === 'kr' ? '예약이 완료되었습니다!' : 'Booking Successful!'}
                                </h3>

                                {bookingId && (
                                    <div className="inline-flex items-center gap-1.5 bg-[#c9a96e]/15 border border-[#c9a96e]/30 px-3.5 py-1 rounded-full text-xs font-mono text-[#f2d58d] font-bold">
                                        <span>{lang === 'vi' ? 'Mã đơn:' : 'Order ID:'}</span>
                                        <span>#{bookingId}</span>
                                    </div>
                                )}

                                <p className="text-xs md:text-sm text-[#e2be6f] font-medium pt-1 max-w-sm mx-auto leading-relaxed">
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

                            {/* Single Action: Return to Home (Dismisses modal, clears cart cache, redirects to / safely) */}
                            <div className="w-full pt-4">
                                <button
                                    id="modal-step3-return-home-btn"
                                    type="button"
                                    onClick={handleReturnHome}
                                    className="w-full bg-gradient-to-r from-[#ecd38f] to-[#c6a55f] text-[#2c2416] py-3.5 rounded-2xl font-bold uppercase text-xs tracking-wider shadow-lg hover:brightness-105 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    <span>
                                        {lang === 'vi' ? 'Quay về trang chủ' : 
                                         lang === 'cn' ? '返回首页' : 
                                         lang === 'jp' ? 'ホームに戻る' : 
                                         lang === 'kr' ? '홈으로 돌아가기' : 
                                         'Return to Home'}
                                    </span>
                                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ================= RICH PAYMENT METHOD INFO POPOVER ================= */}
            {activeMethodId && (
                <div 
                    className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveMethodId(null);
                    }}
                >
                    <div 
                        className="bg-black/60 backdrop-blur-2xl border border-[#c9a96e]/40 max-w-md w-full p-5 sm:p-6 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative space-y-4 max-h-[85vh] flex flex-col cursor-pointer"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/15 border border-[#c9a96e]/30 flex items-center justify-center text-[#f2d58d]">
                                    {activeMethodId === 'cash_vnd' && <Banknote size={18} />}
                                    {activeMethodId === 'cash_usd' && <DollarSign size={18} />}
                                    {activeMethodId === 'card' && <CreditCard size={18} />}
                                    {activeMethodId === 'transfer' && <QrCode size={18} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-base">
                                        {activeMethodId === 'cash_vnd' && (lang === 'vi' ? 'Tiền mặt tại Spa (VND)' : 'Cash at Spa (VND)')}
                                        {activeMethodId === 'cash_usd' && (lang === 'vi' ? 'Tiền mặt USD' : 'Cash (USD)')}
                                        {activeMethodId === 'card' && (lang === 'vi' ? 'Thẻ POS & Không tiếp xúc' : 'Credit / POS Card')}
                                        {activeMethodId === 'transfer' && (lang === 'vi' ? 'VietQR / Chuyển khoản 24/7' : 'VietQR Transfer')}
                                    </h4>
                                    <p className="text-[11px] text-[#f2d58d]">
                                        {activeMethodId === 'cash_vnd' && (lang === 'vi' ? 'Các mệnh giá tiền Polymer Việt Nam Đồng' : 'Accepted VND Polymer Denominations')}
                                        {activeMethodId === 'cash_usd' && (lang === 'vi' ? 'Quy định thu đổi & hoàn tiền' : 'Collection & Exchange Rules')}
                                        {activeMethodId === 'card' && (lang === 'vi' ? 'Các loại thẻ và ví điện tử hỗ trợ' : 'Accepted Cards & Mobile Wallets')}
                                        {activeMethodId === 'transfer' && (lang === 'vi' ? 'Quét mã QR chuyển khoản nhanh' : 'Instant dynamic QR transfer')}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveMethodId(null)}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Popover Scrollable Body */}
                        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar min-h-0">
                            
                            {/* CASH VND CONTENT: Grid of 7 Banknotes */}
                            {activeMethodId === 'cash_vnd' && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-300">
                                        {lang === 'vi'
                                            ? 'Quý khách thanh toán tiền mặt trực tiếp tại quầy thu ngân. Spa chấp nhận tất cả các mệnh giá tiền polymer Việt Nam Đồng:'
                                            : 'Pay directly at the cashier desk. Oria Spa accepts all standard Vietnamese Dong polymer notes:'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {VND_DENOMINATIONS.map((denom) => (
                                            <div key={denom.amount} className="flex flex-col items-center gap-1 bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
                                                <div className="rounded-lg overflow-hidden border border-white/10 aspect-[2/1] w-full relative">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={denom.imgUrl} alt={`${formatCurrency(denom.amount)} VND`} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-[11px] font-bold text-[#f2d58d]">{formatCurrency(denom.amount)} VND</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CASH USD CONTENT: Exchange Rate + Refund Note + USD Illustration */}
                            {activeMethodId === 'cash_usd' && (
                                <div className="space-y-3">
                                    {/* Exchange Rate Box */}
                                    <div className="bg-black/50 border border-[#C9A96E]/40 rounded-2xl p-3.5 text-center">
                                        <div className="text-[11px] text-[#C9A96E] font-bold uppercase tracking-wider mb-0.5">
                                            {lang === 'vi' ? 'Tỷ giá quy đổi' : 'Exchange Rate'}
                                        </div>
                                        <div className="text-xl font-black text-[#f2d58d]">
                                            1 USD = {formatCurrency(USD_INFO.exchangeRate)} VND
                                        </div>
                                    </div>

                                    {/* Refund in VND note */}
                                    <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-3 flex gap-2.5 items-center">
                                        <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                            <ArrowRightLeft size={14} className="text-blue-400" />
                                        </div>
                                        <p className="text-xs text-blue-300 leading-snug font-medium">
                                            {dict.payment_methods?.refund_note || (lang === 'vi' ? 'Tiền thừa sẽ được thối lại bằng tiền mặt Việt Nam Đồng (VND).' : 'Change will be returned in VND cash.')}
                                        </p>
                                    </div>

                                    {/* USD Banknotes image */}
                                    <div className="rounded-xl overflow-hidden border border-white/10 shadow-sm">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={USD_INFO.imgUrl} alt="USD Cash" className="w-full h-auto object-cover" />
                                    </div>
                                </div>
                            )}

                            {/* CARD CONTENT: Accepted Cards Grid */}
                            {activeMethodId === 'card' && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-300">
                                        {lang === 'vi'
                                            ? 'Thanh toán quẹt thẻ máy POS không phụ phí giao dịch. Hỗ trợ tất cả các thẻ quốc tế và ví thông minh:'
                                            : 'Zero surcharge card payment via POS terminal. Supports all major international cards and mobile wallets:'}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {ACCEPTED_CARDS.map((card) => (
                                            <div key={card.name} className="flex flex-col items-center gap-1.5 bg-white p-2 rounded-xl border border-white/10 shadow-sm">
                                                <div className="w-full h-8 flex items-center justify-center overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={card.img} alt={card.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-700 text-center leading-none">{card.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TRANSFER CONTENT: QR / Transfer */}
                            {activeMethodId === 'transfer' && (
                                <div className="space-y-3 text-center">
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-[#c9a96e]/15 border border-[#c9a96e]/30 flex items-center justify-center text-[#f2d58d]">
                                            <QrCode size={30} />
                                        </div>
                                        <div className="text-sm font-bold text-[#f2d58d]">QR & Bank Transfer</div>
                                        <p className="text-sm text-gray-200 leading-relaxed font-medium">
                                            Chúng tôi hỗ trợ international transfer, domestic transfer
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Popover Footer Button */}
                        <div className="pt-2 border-t border-white/10 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveMethodId(null)}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ecd38f] to-[#c6a55f] text-[#2c2416] text-xs font-bold uppercase tracking-wider hover:brightness-105 transition-all cursor-pointer"
                            >
                                {lang === 'vi' ? 'Đã hiểu' : 'Understood'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

import React, { useEffect, useState } from 'react';
import { X, ClipboardList, Clock, ArrowRight, Check, User, HeartPulse, Ban, GripHorizontal, AlertCircle, Phone, Mail, Hand } from 'lucide-react';
import { CartItem } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';
import { createClient } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import AlertModal from '@/components/Shared/AlertModal';

// 🔧 UI CONFIGURATION
const UI_CONFIG = {
    MODAL_MAX_WIDTH: '480px',
    SUCCESS_MODAL_MAX_WIDTH: '400px',
    BORDER_RADIUS: '32px',
    REDIRECT_DELAY: 1500,
    COUNTDOWN_INTERVAL: 700,
    ESTIMATED_START_OFFSET: 15, // minutes
    ANIMATION_DURATION: '300ms',
    TABLET_RESET_SECONDS: 180, // Auto-reset countdown for tablet (3 phút)
    QR_SIZE: 200,
    JOURNEY_BASE_URL: 'https://nganha.vercel.app',
};

interface OrderConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => any;
    lang: string;
    dict: any; // Accept dict
    cart: CartItem[];
    customerInfo: {
        name: string;
        email: string;
        phone: string;
        gender: string;
    };
    paymentMethod: string; // code (e.g. 'cash_vnd')
    amountPaid: number;
    guestCount?: number;
    bookingDate?: string;
    bookingTime?: string;
}

const OrderConfirmModal: React.FC<OrderConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    lang,
    dict,
    cart,
    customerInfo,
    paymentMethod,
    amountPaid,
    guestCount = 1,
    bookingDate,
    bookingTime,
}) => {
    // 1. Move all hooks to the top (React requirement)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(2); // Countdown display
    const [isTabletDevice, setIsTabletDevice] = useState(false);
    const [tabletResetCountdown, setTabletResetCountdown] = useState(UI_CONFIG.TABLET_RESET_SECONDS);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });

    // Check if current device is a registered Tablet
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

    // --- Helper Functions (Hoisted or defined before use) ---
    const handleDone = () => {
        if (bookingId) {
            window.location.href = `/${lang}/journey/${bookingId}`;
        } else {
            window.location.reload();
        }
    };

    const handleTabletReset = () => {
        window.location.href = '/';
    };

    // Auto-reset countdown for TABLET devices
    useEffect(() => {
        if (success && bookingId && isTabletDevice) {
            const interval = setInterval(() => {
                setTabletResetCountdown(prev => {
                    if (prev <= 1) {
                        handleTabletReset();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [success, bookingId, isTabletDevice]);

    // Prevent interaction if closed - This MUST be after hooks but before JSX
    if (!isOpen) return null;

    // Calculations
    const totalVND = cart.reduce((sum, item) => sum + item.priceVND * item.qty, 0);
    const changeAmount = amountPaid - totalVND;
    const totalTime = cart.reduce((sum, item) => sum + item.timeValue * item.qty, 0);

    // Collect all tags for General Notes
    const allTags = cart.reduce((acc: string[], item) => {
        const itemTags = [
            item.options?.notes?.tag0 ? 'Pregnant' : null,
            item.options?.notes?.tag1 ? 'Allergy' : null
        ].filter(Boolean) as string[];
        return [...acc, ...itemTags];
    }, []);
    const uniqueTags = Array.from(new Set(allTags));

    // Times (Estimated)
    const now = new Date();
    const startTimeComp = new Date(now.getTime() + UI_CONFIG.ESTIMATED_START_OFFSET * 60000);
    const endTimeComp = new Date(startTimeComp.getTime() + totalTime * 60000);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const returnedId = await onConfirm({});
            if (returnedId) {
                setBookingId(returnedId);
            }
            setSuccess(true);
        } catch (error: any) {
            console.error("Submit error", error);
            setAlertState({
                isOpen: true,
                message: dict.checkout?.alerts?.order_error || "Error sending order. Please try again.",
                type: 'error'
            });
            setIsSubmitting(false);
            setSuccess(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnHome = () => {
        try {
            localStorage.removeItem('BOOKING_CART');
            localStorage.removeItem('booking_cart');
            localStorage.removeItem('SPAWIFI_CART');
        } catch (e) {
            console.error('Error clearing cart cache', e);
        }
        window.location.href = `/${lang}`;
    };

    if (success) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : UI_CONFIG.JOURNEY_BASE_URL;
        const journeyUrl = `${baseUrl}/${lang}/journey/${bookingId}`;

        // === TABLET MODE: Show QR Code ===
        if (isTabletDevice && bookingId) {
            return (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
                    <div
                        className="w-full max-w-lg p-8 flex flex-col items-center text-center space-y-6 m-4 animate-in zoom-in-95 duration-300 bg-[#121124]/95 border border-[#c9a96e]/30 rounded-[28px] shadow-2xl"
                    >
                        {/* Success Check */}
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500/30">
                            <Check size={40} className="text-green-400" strokeWidth={4} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {dict.checkout?.order_submitted || 'Order Submitted!'}
                            </h2>
                            <p className="text-[#e2be6f] text-sm">
                                {dict.checkout?.scan_qr || 'Scan QR code to track your service on your phone'}
                            </p>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-indigo-500/20">
                            <QRCodeSVG
                                value={journeyUrl}
                                size={UI_CONFIG.QR_SIZE}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                    src: '/logo.png',
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
                        </div>

                        {/* Info */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">{dict.checkout?.total_bill || 'Total'}</span>
                                <span className="font-bold text-[#f2d58d] text-lg">{formatCurrency(totalVND)} VND</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex gap-2 items-center text-gray-400">
                                    <Clock size={16} />
                                    <span>{dict.checkout?.time || (lang === 'en' ? 'Time' : 'Thời gian')}</span>
                                </div>
                                <span className="font-bold text-white">{totalTime} {dict.checkout?.mins || (lang === 'vi' ? 'phút' : 'mins')}</span>
                            </div>
                        </div>

                        {/* Auto-reset countdown */}
                        <div className="space-y-3 w-full">
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#c9a96e] to-[#ecd38f] rounded-full transition-all duration-1000 ease-linear"
                                    style={{ width: `${(tabletResetCountdown / UI_CONFIG.TABLET_RESET_SECONDS) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-[#d1cbbd]">
                                {dict.checkout?.screen_resets_in || 'Screen resets in'} <span className="font-bold text-[#f2d58d]">{tabletResetCountdown}s</span>
                            </p>
                        </div>

                        <button
                            onClick={handleTabletReset}
                            className="text-[#c9a96e] text-sm font-medium hover:text-white transition-colors"
                        >
                            {dict.checkout?.reset_now || '<- Reset now'}
                        </button>
                    </div>
                </div>
            );
        }

        // === NORMAL WEB BOOKING MODE: Premium Thank You Screen ===
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 p-4">
                <div 
                    className="bg-[#121124]/90 backdrop-blur-2xl border border-[#c9a96e]/30 w-full p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5 m-auto relative overflow-hidden animate-in zoom-in-95 duration-300 rounded-[28px]"
                    style={{ maxWidth: '440px' }}
                >
                    {/* Gold Glow Background */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#C9A96E]/20 rounded-full blur-3xl -z-10 opacity-70"></div>

                    <div className="w-16 h-16 bg-gradient-to-br from-[#c9a96e]/20 to-black/40 rounded-full flex items-center justify-center animate-in zoom-in duration-500 border border-[#C9A96E]/40 shadow-inner">
                        <Check size={32} className="text-[#f2d58d]" strokeWidth={3.5} />
                    </div>

                    <div className="space-y-1.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                            {lang === 'vi' ? '🎉 Đặt lịch thành công!' : lang === 'cn' ? '🎉 预约成功！' : lang === 'jp' ? '🎉 ご予約が完了しました！' : lang === 'kr' ? '🎉 예약이 완료되었습니다!' : '🎉 Booking Successful!'}
                        </h2>
                        {bookingId && (
                            <div className="inline-flex items-center gap-1.5 bg-[#c9a96e]/15 border border-[#c9a96e]/30 px-3 py-1 rounded-full text-xs font-mono text-[#f2d58d] font-bold">
                                <span>{lang === 'vi' ? 'Mã đơn:' : 'Order ID:'}</span>
                                <span>#{bookingId}</span>
                            </div>
                        )}
                        <p className="text-xs sm:text-sm text-[#e2be6f] font-medium pt-1">
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

                    <div className="w-full space-y-3">
                        {/* Summary Card */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 shadow-sm space-y-2.5 text-left text-xs">
                            {/* Booking schedule */}
                            {(bookingDate || bookingTime) && (
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-gray-400">{lang === 'vi' ? 'Lịch hẹn:' : 'Schedule:'}</span>
                                    <span className="font-bold text-[#f2d58d]">{bookingDate} · {bookingTime}</span>
                                </div>
                            )}

                            {/* Number of guests */}
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-gray-400">{lang === 'vi' ? 'Số lượng khách:' : 'Guests:'}</span>
                                <span className="font-bold text-white">{guestCount} {lang === 'vi' ? 'khách' : 'guest(s)'}</span>
                            </div>

                            {/* Services List */}
                            <div className="space-y-1.5 py-1">
                                {cart.map((item, idx) => (
                                    <div key={item.cartId || idx} className="flex justify-between items-start">
                                        <span className="text-gray-300 truncate pr-2">{idx + 1}. {item.names?.[lang] || item.names?.en || 'Service'}</span>
                                        <span className="font-bold text-white shrink-0">{formatCurrency(item.priceVND * item.qty)} đ</span>
                                    </div>
                                ))}
                            </div>

                            {/* Total Amount */}
                            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-bold">{dict.checkout?.total_bill || 'Tổng cộng'}:</span>
                                <span className="font-bold text-[#f2d58d] text-base">{formatCurrency(totalVND)} VND</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full pt-2">
                        <button
                            onClick={handleReturnHome}
                            className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-[#ecd38f] to-[#c6a55f] text-[#2c2416] hover:brightness-105 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>{lang === 'vi' ? 'Quay về trang chủ' : 'Return to Home'}</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                </div>
            </div>
        );
    }

    const formatParts = (parts: string[]) => {
        if (parts.length >= 8) {
            return dict.custom_for_you?.full_body || 'Full Body';
        }
        return parts.map(p => {
            // @ts-ignore
            return dict.body_parts?.[p.toLowerCase()] || dict.body_parts?.[p] || p;
        }).join(', ');
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in pb-0 sm:pb-0 p-0 sm:p-4">
            <div
                className="bg-[#121124]/95 backdrop-blur-2xl border border-[#c9a96e]/25 w-full max-h-[92vh] md:max-h-[85vh] sm:rounded-[28px] rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 md:max-w-4xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="pt-6 pb-3 flex flex-col items-center text-center px-6 border-b border-white/10 shrink-0 z-10 bg-transparent">
                    <div className="w-12 h-12 bg-white/[0.04] rounded-full flex items-center justify-center text-[#C9A96E] mb-2 border border-[#C9A96E]/30">
                        <ClipboardList size={24} strokeWidth={2.2} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                        {dict.checkout?.modal_title || 'Xác nhận yêu cầu'}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-400 mt-0.5 font-medium">
                        {dict.checkout?.review_text || 'Vui lòng kiểm tra lại đơn hàng.'}
                    </p>
                </div>

                {/* Body: Responsive 2-Column on Desktop (md:), 1-Column on Mobile */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar min-h-0">
                    <div className="md:grid md:grid-cols-12 md:gap-6 space-y-4 md:space-y-0">
                        
                        {/* LEFT COLUMN (Desktop): Customer Info, Booking Time, Expected Time */}
                        <div className="md:col-span-5 space-y-4">
                            {/* Customer Details Card */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2.5">
                                <div className="text-[11px] font-bold text-[#C9A96E] uppercase tracking-wider mb-1">
                                    {dict.checkout?.customer_details || 'Thông tin đặt hẹn'}
                                </div>
                                <div className="space-y-2 text-xs md:text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">{dict.checkout?.name || 'Họ và tên'}</span>
                                        <span className="font-bold text-[#f2d58d]">{customerInfo.name || 'Guest'}</span>
                                    </div>
                                    {customerInfo.phone && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">{dict.checkout?.phone_label || 'Số điện thoại'}</span>
                                            <span className="font-bold text-white">{customerInfo.phone}</span>
                                        </div>
                                    )}
                                    {customerInfo.email && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">{dict.checkout?.email_label || 'Email'}</span>
                                            <span className="font-bold text-white truncate max-w-[170px]">{customerInfo.email}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-1 border-t border-white/5">
                                        <span className="text-gray-400">{lang === 'vi' ? 'Số lượng khách' : 'Guests'}</span>
                                        <span className="font-bold text-[#f2d58d]">{guestCount} {lang === 'vi' ? 'khách' : 'guest(s)'}</span>
                                    </div>
                                    {(bookingDate || bookingTime) && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">{lang === 'vi' ? 'Lịch hẹn' : 'Booking time'}</span>
                                            <span className="font-bold text-[#f2d58d]">{bookingDate} · {bookingTime}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expected Time Card */}
                            <div className="bg-white/[0.03] border border-[#C9A96E]/25 rounded-2xl p-4 space-y-2">
                                <div className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-wider mb-1">
                                    {dict.checkout.expected_time}
                                </div>
                                <div className="flex justify-between text-xs md:text-sm font-medium text-gray-300">
                                    <span>{dict.checkout.start_time}</span>
                                    <span className="text-[#f2d58d] font-bold">{formatTime(startTimeComp)}</span>
                                </div>
                                <div className="flex justify-between text-xs md:text-sm font-medium text-gray-300">
                                    <span>{dict.checkout.end_time}</span>
                                    <span className="text-[#f2d58d] font-bold">{formatTime(endTimeComp)}</span>
                                </div>
                            </div>

                            {/* General Notes Alert */}
                            {uniqueTags.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-start gap-2.5">
                                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <span className="font-bold text-red-400 block mb-1">{dict.checkout.general_notes}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {uniqueTags.map(tag => (
                                                <span key={tag} className="text-red-300 font-medium flex items-center gap-1">
                                                    {(tag === 'Pregnant' || tag === (dict.tags?.pregnant)) ? (dict.tags?.pregnant) : (dict.tags?.allergy)} {tag.includes('Pregnant') || tag === dict.tags?.pregnant ? '🤰' : '⚠️'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN (Desktop): Services List, Payment Summary & Action Buttons */}
                        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                            
                            {/* Order Summary & Items List */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[11px] font-bold text-[#C9A96E] uppercase tracking-wider">
                                        {dict.checkout.order_summary}
                                    </span>
                                    <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5">
                                        {cart.length} {dict.checkout.items}
                                    </span>
                                </div>

                                <div className="space-y-2.5 max-h-[220px] md:max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                                    {cart.map((item, idx) => {
                                        const strength = item.options?.strength;
                                        const therapist = item.options?.therapist;
                                        const focus = item.options?.bodyParts?.focus || [];
                                        const avoid = item.options?.bodyParts?.avoid || [];

                                        const tags = [
                                            item.options?.notes?.tag0 ? (dict.tags?.pregnant || 'Pregnant') : null,
                                            item.options?.notes?.tag1 ? (dict.tags?.allergy || 'Allergy') : null
                                        ].filter(Boolean) as string[];

                                        return (
                                            <div key={item.cartId || idx} className="border border-white/10 rounded-2xl p-3.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                                {/* Name & Price */}
                                                <div className="flex justify-between items-start mb-1.5 gap-2">
                                                    <span className="font-bold text-white text-sm truncate flex-1">
                                                        {idx + 1}. {item.names?.[lang] || item.names?.en || 'Service'}
                                                    </span>
                                                    <span className="font-bold text-[#f2d58d] text-sm shrink-0">
                                                        {formatCurrency(item.priceVND * item.qty)} VND
                                                    </span>
                                                </div>

                                                {/* Details */}
                                                <div className="space-y-1.5 text-xs text-gray-400">
                                                    {(item.timeValue > 0 || item.timeDisplay) && (
                                                        <div className="flex justify-between items-center">
                                                            <span>{dict.checkout?.time || 'Thời gian'}</span>
                                                            <span className="font-bold text-gray-200">{item.timeValue || item.timeDisplay} {dict.checkout?.mins || 'phút'}</span>
                                                        </div>
                                                    )}
                                                    {strength && (
                                                        <div className="flex justify-between items-center">
                                                            <span>{dict.custom_for_you?.strength_label || 'Lực'}</span>
                                                            <span className="font-bold text-gray-200 capitalize">{strength}</span>
                                                        </div>
                                                    )}
                                                    {therapist && (
                                                        <div className="flex justify-between items-center">
                                                            <span>{dict.custom_for_you?.therapist_gender || 'KTV'}</span>
                                                            <span className="font-bold text-gray-200 capitalize">{therapist}</span>
                                                        </div>
                                                    )}
                                                    {focus.length > 0 && (
                                                        <div className="flex justify-between items-center">
                                                            <span>{dict.custom_for_you?.focus_areas || 'Tập trung'}</span>
                                                            <span className="font-bold text-[#f2d58d] text-right truncate max-w-[160px]">{formatParts(focus)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2.5">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>{dict.checkout.payment_method}</span>
                                    <span className="font-bold text-[#f2d58d] uppercase">
                                        {dict.payment_methods?.[paymentMethod] || dict.payment_methods?.cash_vnd || 'Cash (VND)'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                    <span className="font-bold text-white text-sm md:text-base">{dict.checkout.total_bill}</span>
                                    <span className="font-bold text-[#f2d58d] text-base md:text-lg">{formatCurrency(totalVND)} VND</span>
                                </div>
                            </div>

                            {/* Footer Buttons (Embedded in right column on desktop) */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold uppercase text-xs tracking-wider hover:bg-white/5 transition-colors active:scale-[0.98]"
                                >
                                    {dict.checkout.cancel}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                    className="flex-[1.5] bg-gradient-to-r from-[#ecd38f] to-[#c6a55f] text-[#2c2416] py-3 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg hover:brightness-105 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                                >
                                    <span>{dict.checkout.submit}</span>
                                    {!isSubmitting && <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />}
                                </button>
                            </div>

                        </div>
                    </div>
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
};

export default OrderConfirmModal;

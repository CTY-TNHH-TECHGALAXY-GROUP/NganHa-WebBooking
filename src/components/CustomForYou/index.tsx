'use client';

import { Z } from '@/lib/zIndex';
import React, { useState, useEffect, useRef } from "react";
import { X, Check, ChevronDown } from "lucide-react";
import { ServiceData, CustomPreferences, LanguageCode } from "./types";
import { getText } from "./utils";
import { getDictionary } from "@/lib/dictionaries"; // Import getDictionary
import { formatCurrency } from "@/components/Menu/utils";
import BodyMap from "./BodyMap";
import NoteSection from "./NoteSection";
import Preferences from "./Preferences";
import { resolveServiceCapabilities } from '@/lib/booking/capabilities';

interface CustomForYouModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (prefs: CustomPreferences) => void;
    serviceData: ServiceData;
    lang: LanguageCode;
    initialData?: CustomPreferences;
    privateRoomPriceVND?: number;
    privateRoomPriceUSD?: number;
}

export default function CustomForYouModal({
    isOpen,
    onClose,
    onSave,
    serviceData,
    lang,
    initialData,
    privateRoomPriceVND,
    privateRoomPriceUSD
}: CustomForYouModalProps) {
    const dict = getDictionary(lang); // Get dictionary
    const capabilities = resolveServiceCapabilities({
        showCustomForYou: serviceData.SHOW_CUSTOM_FOR_YOU,
        showPreferences: serviceData.SHOW_PREFERENCES,
        showStrength: serviceData.SHOW_STRENGTH,
        showGender: serviceData.SHOW_GENDER,
        showFocus: serviceData.SHOW_FOCUS,
        showNotes: serviceData.SHOW_NOTES,
        focusConfig: serviceData.FOCUS_POSITION,
    });
    const canAddPrivateRoom = capabilities.notes && serviceData.ID !== 'NHS0900' &&
        (privateRoomPriceVND !== undefined || privateRoomPriceUSD !== undefined);
    const createPreferences = (source?: CustomPreferences): CustomPreferences => ({
        bodyParts: capabilities.focus ? {
            focus: source?.bodyParts?.focus || [],
            avoid: source?.bodyParts?.avoid || [],
        } : { focus: [], avoid: [] },
        notes: capabilities.notes ? {
            tag0: source?.notes?.tag0 || false,
            tag1: source?.notes?.tag1 || false,
            content: source?.notes?.content || '',
        } : { tag0: false, tag1: false, content: '' },
        strength: capabilities.strength ? source?.strength || 'medium' : undefined,
        therapist: capabilities.gender ? source?.therapist || 'random' : undefined,
        addons: canAddPrivateRoom ? { privateRoom: source?.addons?.privateRoom || false } : undefined,
    });
    const pendingReview = initialData ? [
        !capabilities.strength && initialData.strength ? getText({
            en: 'Strength selection', vi: 'Lựa chọn lực tay', jp: '強さの選択', kr: '강도 선택', cn: '力度选择',
        }, lang) : null,
        !capabilities.gender && initialData.therapist ? getText({
            en: 'Therapist selection', vi: 'Lựa chọn KTV', jp: 'セラピストの選択', kr: '테라피스트 선택', cn: '技师选择',
        }, lang) : null,
        !capabilities.focus && (initialData.bodyParts?.focus?.length || initialData.bodyParts?.avoid?.length) ? getText({
            en: 'Focus / avoid areas', vi: 'Vùng tập trung / cần tránh', jp: '集中・回避部位', kr: '집중 / 피할 부위', cn: '重点 / 避开区域',
        }, lang) : null,
        !capabilities.notes && (initialData.notes?.tag0 || initialData.notes?.tag1 || initialData.notes?.content) ? getText({
            en: 'Treatment notes', vi: 'Ghi chú trị liệu', jp: '施術メモ', kr: '시술 메모', cn: '护理备注',
        }, lang) : null,
    ].filter((value): value is string => Boolean(value)) : [];

    // Default State
    const [prefs, setPrefs] = useState<CustomPreferences>(() => createPreferences());

    // Tracking scroll to show/hide bottom indicator
    const [isAtBottom, setIsAtBottom] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 20) {
            setIsAtBottom(true);
        } else {
            setIsAtBottom(false);
        }
    };

    // Reset or Load initial data when modal opens

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setPrefs(createPreferences(initialData));
            } else {
                setPrefs(createPreferences());
            }
        }
    }, [isOpen, initialData, serviceData]);

    if (!isOpen) return null;

    // handlers
    const handleBodyToggle = (type: 'focus' | 'avoid', area: string) => {
        setPrefs(prev => {
            let newFocus = [...prev.bodyParts.focus];
            let newAvoid = [...prev.bodyParts.avoid];

            if (area === 'CLEAR_ALL') {
                return { ...prev, bodyParts: { focus: [], avoid: [] } };
            }

            if ((area === 'FULL_BODY' || area === 'WHOLE_BODY') && type === 'focus') {
                const allParts = capabilities.allowedBodyAreas
                    .filter(k => k.toUpperCase() !== 'WHOLE_BODY' && k.toUpperCase() !== 'FULL_BODY');
                return { ...prev, bodyParts: { focus: allParts, avoid: [] } };
            }

            // Normal toggle
            if (type === 'focus') {
                if (newFocus.includes(area)) {
                    newFocus = newFocus.filter(k => k !== area);
                } else {
                    newFocus.push(area);
                    newAvoid = newAvoid.filter(k => k !== area);
                }
            } else { // avoid
                if (newAvoid.includes(area)) {
                    newAvoid = newAvoid.filter(k => k !== area);
                } else {
                    newAvoid.push(area);
                    newFocus = newFocus.filter(k => k !== area);
                }
            }

            return { ...prev, bodyParts: { focus: newFocus, avoid: newAvoid } };
        });
    };

    const handleNoteChange = (key: string, value: any) => {
        setPrefs(prev => ({ ...prev, notes: { ...prev.notes, [key]: value } }));
    };

    const handlePrefChange = (key: string, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
    };

    const showNotes = capabilities.notes;
    const showPreferences = capabilities.preferences;

    return (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200" style={{ zIndex: Z.MODAL }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content - Fixed Height for no scroll */}
            <div className="relative w-full sm:w-[95vw] sm:max-w-[540px] bg-[#0d0d0d] rounded-t-[32px] rounded-b-none sm:rounded-[32px] overflow-hidden flex flex-col h-[90dvh] sm:h-[80vh] sm:max-h-[780px] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border border-white/10 shadow-2xl">

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between z-20">
                    <div>
                        <h2 className="text-xl font-serif tracking-wide text-[#C9A96E]">{dict.custom_for_you?.title}</h2>
                        <p className="text-sm text-gray-400 font-medium mt-0.5">
                            {getText(serviceData.NAMES, lang)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area - Hidden overflow and flex to fit */}
                <div className="flex-1 overflow-hidden relative">
                    <div 
                        className="absolute inset-0 overflow-y-auto px-6 py-2 custom-scrollbar"
                        onScroll={handleScroll}
                    >
                        <div className="space-y-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {pendingReview.length > 0 && (
                                <div className="rounded-xl border border-[#C9A96E]/40 bg-[#C9A96E]/10 px-4 py-3 text-sm text-[#f2d58d]" role="alert">
                                    <p className="font-semibold">
                                        {getText({
                                            en: 'Some saved choices need your review before they are removed:',
                                            vi: 'Một số lựa chọn cũ cần bạn xem lại trước khi được bỏ:',
                                            jp: '保存済みの選択を削除する前に確認してください:',
                                            kr: '저장된 선택을 삭제하기 전에 확인해 주세요:',
                                            cn: '删除已保存的选项前，请先确认:',
                                        }, lang)}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-300">{pendingReview.join(', ')}</p>
                                </div>
                            )}
                            
                            {/* 1. Therapist & Strength (Now on Top) */}
                            {showPreferences && (
                                <Preferences
                                    lang={lang}
                                    showStrength={capabilities.strength}
                                    showGender={capabilities.gender}
                                    values={{ strength: prefs.strength, therapist: prefs.therapist }}
                                    onChange={handlePrefChange}
                                />
                            )}

                            {/* 2. Body Map & Focus Areas */}
                            {capabilities.focus && (
                                <div>
                                    <BodyMap
                                        focus={prefs.bodyParts?.focus || []}
                                        avoid={prefs.bodyParts?.avoid || []}
                                        lang={lang}
                                        serviceData={serviceData}
                                        onToggle={handleBodyToggle}
                                    />
                                </div>
                            )}

                            {/* 3. Notes Section */}
                            {showNotes && (
                                <NoteSection
                                    lang={lang}
                                    serviceData={serviceData}
                                    notes={prefs.notes}
                                    onChange={handleNoteChange}
                                />
                            )}
                            
                            {/* Room is an add-on, never a treatment preference. */}
                            {canAddPrivateRoom && <div className="pt-2">
                                <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                                    prefs.addons?.privateRoom 
                                        ? 'bg-[#1c1c1e] border-[#C9A96E]/50 shadow-[0_0_15px_rgba(201,169,110,0.1)]' 
                                        : 'bg-[#1c1c1e] border-white/5 hover:border-white/20'
                                }`}>
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-[15px] font-medium transition-colors ${
                                            prefs.addons?.privateRoom ? 'text-[#C9A96E]' : 'text-gray-200'
                                        }`}>
                                            {getText({ en: 'Private Room', vi: 'Phòng riêng', jp: '個室', kr: '프라이빗 룸', cn: '包间' }, lang)}
                                        </span>
                                        {(privateRoomPriceVND !== undefined || privateRoomPriceUSD !== undefined) && (
                                            <span className="text-[13px] text-gray-500 font-medium">
                                                {privateRoomPriceVND !== undefined && `+ ${formatCurrency(privateRoomPriceVND)} VND`}
                                                {privateRoomPriceUSD !== undefined && ` · $${privateRoomPriceUSD.toFixed(2)} USD`}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className={`relative w-[48px] h-[28px] rounded-full transition-colors duration-300 ease-in-out ${
                                        prefs.addons?.privateRoom ? 'bg-[#C9A96E]' : 'bg-[#2c2c2e]'
                                    }`}>
                                        <div className={`absolute top-[2px] left-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out flex items-center justify-center ${
                                            prefs.addons?.privateRoom ? 'translate-x-[20px]' : 'translate-x-0'
                                        }`} />
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="sr-only"
                                        checked={prefs.addons?.privateRoom || false}
                                        onChange={(e) => handlePrefChange('addons', { ...prefs.addons, privateRoom: e.target.checked })}
                                    />
                                </label>
                            </div>}
                        </div>
                    </div>

                    {/* Lớp chặn Gradient nhạt (tuỳ chọn thêm để đẹp hơn) kết hợp Mũi tên */}
                    <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none transition-opacity duration-300 ${isAtBottom ? 'opacity-0' : 'opacity-100'}`} />
                    
                    {/* Scroll Indicator: Mũi tên nhấp nháy */}
                    <div className={`absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-30 transition-opacity duration-300 ${isAtBottom ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="bg-[#1c1c1e]/80 rounded-full p-1.5 backdrop-blur-sm border border-[#C9A96E]/30 shadow-xl animate-bounce">
                            <ChevronDown className="w-5 h-5 text-[#C9A96E]" />
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="bg-[#0d0d0d] pb-[env(safe-area-inset-bottom)] z-20 p-4 border-t border-white/10">
                    <button
                        onClick={() => onSave(prefs)}
                        className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#C9A96E]/50 text-[#C9A96E] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
                    >
                        <Check size={20} />
                        {getText({ en: 'SAVE', vi: 'LƯU', jp: '保存', kr: '저장', cn: '保存' }, lang)}
                    </button>
                </div>

            </div>
        </div>
    );
}

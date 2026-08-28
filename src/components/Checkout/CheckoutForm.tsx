'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore.logic';
import { useCheckoutFormLogic, CheckoutFormData } from './CheckoutForm.logic';
import { t } from './CheckoutForm.i18n';

// 🔧 UI CONFIGURATION
const INPUT_BORDER_RADIUS = '12px';
const INPUT_HEIGHT = '48px';
const ACCENT_COLOR = '#10B981'; // Emerald 500

export const CheckoutForm = ({ lang = 'vi' }: { lang?: 'vi' | 'en' }) => {
    const { isAuthUser, user } = useAuthStore();
    const { getInitialData, validateForm } = useCheckoutFormLogic(isAuthUser, user, lang);
    const localeText = t[lang];

    const [formData, setFormData] = useState<CheckoutFormData>(getInitialData());
    const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

    // Sync initial data if auth state changes after render
    useEffect(() => {
        setFormData(getInitialData());
    }, [isAuthUser, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error on typing
        if (errors[name as keyof CheckoutFormData]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleBlur = () => {
        // Optional: Validate on blur
        const currentErrors = validateForm(formData);
        setErrors(currentErrors);
    };

    return (
        <div className="w-full flex flex-col gap-4 p-4 bg-white rounded-[16px] shadow-sm animate-fade-in-up">
            <h3 className="text-lg font-semibold text-gray-800">
                {localeText.customerInfo}
            </h3>

            {!isAuthUser && (
                <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                    {localeText.guestNotice}
                </div>
            )}

            {/* Tên */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-600">
                    {localeText.fullName}
                </label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    readOnly={isAuthUser}
                    className={`px-4 border transition-colors outline-none ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                        } ${isAuthUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}`}
                    style={{ height: INPUT_HEIGHT, borderRadius: INPUT_BORDER_RADIUS }}
                    placeholder="Nhập họ và tên"
                />
                {errors.fullName && <span className="text-xs text-red-500">{errors.fullName}</span>}
            </div>

            {/* Số điện thoại */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-600">
                    {localeText.phone}
                </label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    readOnly={isAuthUser && !!user?.phone} // If auth user doesn't have phone, let them enter it
                    className={`px-4 border transition-colors outline-none ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                        } ${(isAuthUser && !!user?.phone) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}`}
                    style={{ height: INPUT_HEIGHT, borderRadius: INPUT_BORDER_RADIUS }}
                    placeholder="0912 345 678"
                />
                {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-600">
                    {localeText.email}
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    readOnly={isAuthUser && !!user?.email}
                    className={`px-4 border transition-colors outline-none ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                        } ${(isAuthUser && !!user?.email) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800'}`}
                    style={{ height: INPUT_HEIGHT, borderRadius: INPUT_BORDER_RADIUS }}
                    placeholder="email@example.com"
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
            </div>

        </div>
    );
};

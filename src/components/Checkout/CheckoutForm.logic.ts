// @ts-ignore - Ignore TS module resolution issue for literal objects
import { t } from './CheckoutForm.i18n';

export interface CheckoutFormData {
    fullName: string;
    phone: string;
    email: string;
}

export const useCheckoutFormLogic = (
    isAuthUser: boolean,
    user: any | null,
    lang: 'vi' | 'en'
) => {
    const validateForm = (data: CheckoutFormData) => {
        const errors: Partial<Record<keyof CheckoutFormData, string>> = {};
        const localeText = t[lang];

        if (!data.fullName.trim()) {
            errors.fullName = localeText.errorNameRequired;
        }

        if (!data.phone.trim()) {
            errors.phone = localeText.errorPhoneRequired;
        } else if (!/^[0-9]{10,12}$/.test(data.phone.replace(/[\s-]/g, ''))) {
            errors.phone = localeText.errorPhoneInvalid;
        }

        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = localeText.errorEmailInvalid;
        }

        return errors;
    };

    // Pre-fill logic based on auth state
    const getInitialData = (): CheckoutFormData => {
        if (isAuthUser && user) {
            return {
                fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
                phone: user.phone || '',
                email: user.email || '',
            };
        }
        return {
            fullName: '',
            phone: '',
            email: '',
        };
    };

    return {
        validateForm,
        getInitialData,
    };
};

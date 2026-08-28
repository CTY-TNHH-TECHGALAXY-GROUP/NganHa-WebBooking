import { create } from 'zustand';

export interface AuthState {
    isAuthUser: boolean;
    isGuest: boolean;
    user: any | null; // Placeholder for User Object
    loginAsGuest: () => void;
    setUser: (user: any | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthUser: false,
    isGuest: false, // Default states
    user: null,

    loginAsGuest: () => set({ isGuest: true, isAuthUser: false }),
    setUser: (user: any | null) => set({ isGuest: false, isAuthUser: !!user, user }),
    logout: () => set({ isAuthUser: false, isGuest: false, user: null }),
}));

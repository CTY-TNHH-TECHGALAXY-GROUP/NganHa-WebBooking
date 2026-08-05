/*
 * File: Menu/MenuContext.tsx
 * Chức năng: Context API cung cấp dữ liệu dịch vụ toàn cục
 * Logic:
 * - Fetch toàn bộ services ngay khi Provider mount (tại layout).
 * - Cung cấp danh sách services, loading state và error cho toàn app.
 * - Giúp các trang con (như StandardMenu) có data ngay lập tức mà không cần fetch lại.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Service, ServiceOptions, CartItem, Category } from '@/components/Menu/types';
import { getServices } from '@/components/Menu/getServices';
import { readBookingCart, serviceToCartItem, writeBookingCart } from '@/lib/bookingCartStorage';

interface MenuContextType {
    services: Service[];
    categories: Category[]; // Added categories
    loading: boolean;
    error: any;
    refreshData: () => Promise<void>;

    // --- Cart Logic ---
    cart: CartItem[];
    addToCart: (service: Service, qty: number, options?: ServiceOptions) => string;
    updateCartItem: (cartId: string, qty: number) => void;
    updateCartItemOptions: (cartId: string, options: ServiceOptions) => void;
    updateAllCartItemOptions: (options: ServiceOptions) => void;
    removeFromCart: (cartId: string) => void;
    clearCart: () => void;
    getQty: (serviceId: string) => number; // Helper lấy tổng số lượng của 1 service ID
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]); // Add categories state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartHydrated, setCartHydrated] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getServices('all');
            console.log('🚀 [MenuData] Pre-fetched', data.length, 'services');
            setServices(data);
        } catch (err) {
            console.error('❌ [MenuData] Error fetching:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCart(readBookingCart());
        setCartHydrated(true);
    }, []);

    useEffect(() => {
        if (!cartHydrated) return;
        writeBookingCart(cart);
    }, [cart, cartHydrated]);

    // --- CART FUNCTIONS ---

    // 1. Thêm món (Tạo cartId mới hoặc cộng dồn nếu option giống hệt - tạm thời cứ tạo mới để dễ custom)
    const addToCart = (service: Service, qty: number, options?: ServiceOptions) => {
        const newItem = serviceToCartItem(service, qty, options);
        setCart(prev => {
            return [...prev, newItem];
        });
        return newItem.cartId;
    };

    // Cập nhật số lượng
    const updateCartItem = (cartId: string, qty: number) => {
        setCart(prev => {
            if (qty <= 0) {
                return prev.filter(item => item.cartId !== cartId);
            }
            return prev.map(item => item.cartId === cartId ? { ...item, qty } : item);
        });
    };

    // [NEW] Cập nhật options cho 1 item cụ thể (CartId)
    const updateCartItemOptions = (cartId: string, options: ServiceOptions) => {
        setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, options: { ...item.options, ...options } } : item));
    };

    // [NEW] Cập nhật options cho TOÀN BỘ giỏ hàng (Bulk Update)
    const updateAllCartItemOptions = (options: ServiceOptions) => {
        setCart(prev => prev.map(item => ({ ...item, options: { ...item.options, ...options } })));
    };

    // 3. Xóa
    const removeFromCart = (cartId: string) => updateCartItem(cartId, 0);

    // 4. Xóa hết
    const clearCart = () => setCart([]);

    // 5. Helper lấy số lượng (để hiện badge trên Menu)
    const getQty = (serviceId: string) => {
        return cart.filter(item => item.id === serviceId).reduce((sum, item) => sum + item.qty, 0);
    };

    return (
        <MenuContext.Provider value={{
            services, categories, loading, error, refreshData: fetchData,
            cart, addToCart, updateCartItem, updateCartItemOptions, updateAllCartItemOptions, removeFromCart, clearCart, getQty
        }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenuData = () => {
    const context = useContext(MenuContext);
    if (context === undefined) {
        throw new Error('useMenuData must be used within a MenuProvider');
    }
    return context;
};

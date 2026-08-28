'use client';

import { useEffect } from 'react';

export default function IOSViewportFix() {
    useEffect(() => {
        // Hàm tính toán chiều cao thực tế của vùng hiển thị (giống logic trong file HTML của bạn)
        const setAppHeight = () => {
            const doc = document.documentElement;
            doc.style.setProperty('--app-height', `${window.innerHeight}px`);
        };

        // Gọi ngay khi load
        setAppHeight();

        // Lắng nghe sự kiện resize (xoay màn hình, bật bàn phím...)
        window.addEventListener('resize', setAppHeight);

        return () => window.removeEventListener('resize', setAppHeight);
    }, []);

    return null;
}

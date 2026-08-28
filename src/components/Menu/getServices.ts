/*
 * File: Menu/getServices.ts
 * Chức năng: Client-side fetching.
 * Logic mới: Gọi API internal (/api/services) thay vì chọc thẳng vào Firebase.
 */
import { Service } from '../../components/Menu/types';

// Hàm chính lấy dữ liệu (qua API)
export const getServices = async (filterType?: 'standard' | 'vip' | 'all'): Promise<Service[]> => {
    try {
        // Gọi về chính server của mình
        // Lưu ý: Cần đường dẫn tuyệt đối nếu gọi từ Server-side, nhưng hàm này chủ yếu dùng ở Client (useEffect).
        // Nếu dùng ở Server Component, nên dùng hàm import trực tiếp từ @/services/menu.
        const res = await fetch('/api/services', {
            cache: 'no-store' // Luôn lấy mới
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`❌ API Error [${res.status}]:`, errorText);
            throw new Error(`Failed to fetch services API: ${res.status}`);
        }

        const allServices: Service[] = await res.json();

        // Filtering Client-side (nhẹ nhàng vì số lượng service ít)
        if (filterType && filterType !== 'all') {
            return allServices.filter(s => s.menuType === filterType);
        }

        return allServices;

    } catch (error) {
        console.error("❌ Lỗi gọi API Services:", error);
        return [];
    }
};

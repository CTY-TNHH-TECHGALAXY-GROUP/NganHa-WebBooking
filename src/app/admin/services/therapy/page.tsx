'use client';

import React from 'react';

const TherapyAdminPage = () => {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-admin-gold-dim text-admin-gold mb-6">
        <span className="text-3xl">✨</span>
      </div>
      <h1 className="text-2xl font-bold text-admin-text mb-4">Therapy Menu (Sắp ra mắt)</h1>
      <p className="text-admin-text-dim max-w-md mx-auto">
        Khu vực quản lý Media cho Spa Celestial / Menu Trị liệu đang được phát triển.
        Bạn có thể sử dụng Menu Cơ Bản hoặc Pure Relaxation trong thời gian này.
      </p>
    </div>
  );
};

export default TherapyAdminPage;

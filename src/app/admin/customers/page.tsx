'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function HistoryAdminPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Fetch default history (past orders) when loading
    fetchHistory();
  }, []);

  const fetchHistory = async (phone: string = '') => {
    try {
      setLoading(true);
      let url = '/api/admin/bookings?type=history';
      if (phone) url += `&phone=${encodeURIComponent(phone)}`;
      
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setHistory(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    fetchHistory(phoneSearch);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-1 bg-admin-green-a text-admin-green border border-admin-green-b rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Hoàn thành</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={12}/> Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-500/10 text-gray-600 border border-gray-500/20 rounded-lg text-xs font-bold w-fit">{status}</span>;
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Quay lại Quản lý Đặt Lịch
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">📜 Lịch Sử & Tra Cứu Khách Hàng</h1>
        <p className="text-admin-text-dim mt-2">Xem các đơn đã hoàn thành/hủy hoặc tra cứu lịch sử đặt dịch vụ theo số điện thoại.</p>
      </div>

      {/* Search Box */}
      <div className="bg-admin-panel border border-admin-line-strong rounded-2xl p-6 mb-8 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-dim" size={20} />
            <input 
              type="text" 
              placeholder="Nhập số điện thoại khách hàng..." 
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-admin-line-strong rounded-xl outline-none focus:border-admin-gold focus:ring-1 focus:ring-admin-gold transition-colors text-admin-text"
            />
          </div>
          <button 
            type="submit" 
            className="px-6 py-3 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all whitespace-nowrap"
          >
            Tra Cứu
          </button>
          {hasSearched && (
            <button 
              type="button" 
              onClick={() => {
                setPhoneSearch('');
                setHasSearched(false);
                fetchHistory('');
              }}
              className="px-6 py-3 bg-admin-panel-2 border border-admin-line-strong text-admin-text-dim hover:text-admin-text rounded-xl font-medium transition-all whitespace-nowrap"
            >
              Xóa lọc
            </button>
          )}
        </form>
      </div>

      {/* History List */}
      <div className="bg-admin-panel border border-admin-line-strong rounded-2xl shadow-[var(--shadow)] overflow-hidden">
        <div className="p-5 border-b border-admin-line-strong bg-admin-bg/50">
          <h2 className="font-bold text-admin-text flex items-center gap-2">
            <Clock size={18} className="text-admin-gold" />
            {hasSearched ? `Kết quả tra cứu cho SĐT: ${phoneSearch} (${history.length} đơn)` : `Lịch sử đơn gần đây (${history.length} đơn)`}
          </h2>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-admin-text-dim">⏳ Đang tải dữ liệu...</div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-admin-text-dim">
            {hasSearched ? 'Không tìm thấy lịch sử nào cho SĐT này.' : 'Chưa có lịch sử đơn hàng nào.'}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-admin-panel-2 text-admin-text-dim border-b border-admin-line-strong">
                <tr>
                  <th className="p-4 font-semibold">Mã Đơn / Ngày Đặt</th>
                  <th className="p-4 font-semibold">Khách Hàng</th>
                  <th className="p-4 font-semibold">Thời Gian Hẹn</th>
                  <th className="p-4 font-semibold">Dịch vụ đã chọn</th>
                  <th className="p-4 font-semibold">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-line">
                {history.map(booking => (
                  <tr key={booking.id} className="hover:bg-admin-panel-2/50 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-xs text-admin-text-dim mb-1">#{booking.id?.substring(0, 8) || 'N/A'}</div>
                      <div className="text-[13px]">{new Date(booking.created_at).toLocaleString('vi-VN')}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-admin-text text-base">{booking.customerName || 'Khách vãng lai'}</div>
                      <div className="text-admin-text-dim font-medium">{booking.customerPhone}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-admin-gold">
                        {booking.bookingTime || 'N/A'}
                      </div>
                      <div className="text-[13px] text-admin-text-dim mt-0.5">{booking.bookingDate || 'N/A'}</div>
                    </td>
                    <td className="p-4 max-w-[200px] truncate text-wrap">
                      <div className="text-sm line-clamp-2" title={booking.services ? JSON.stringify(booking.services) : 'N/A'}>
                        {typeof booking.services === 'string' ? booking.services : 
                          (booking.services?.length ? `${booking.services.length} dịch vụ` : 'N/A')}
                      </div>
                      <div className="font-bold text-admin-green mt-1">
                        {booking.totalPrice ? booking.totalPrice.toLocaleString() + 'đ' : ''}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(booking.status || 'COMPLETED')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

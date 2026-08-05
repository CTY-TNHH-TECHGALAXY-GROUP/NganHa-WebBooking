'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, XCircle, Search } from 'lucide-react';

export default function BookingsAdminPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bookings?type=new');
      const json = await res.json();
      if (json.success) setBookings(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Bạn có chắc muốn chuyển trạng thái đơn này thành ${newStatus}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchBookings();
      else alert('Lỗi khi cập nhật trạng thái!');
    } catch (err) {
      console.error(err);
      alert('Lỗi hệ thống');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12}/> Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Đã xác nhận</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-500/10 text-gray-600 border border-gray-500/20 rounded-lg text-xs font-bold w-fit">{status}</span>;
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Quay lại Tổng quan
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">📅 Quản Lý Đơn Đặt Lịch</h1>
          <p className="text-admin-text-dim mt-2">Theo dõi và xác nhận các đơn đặt lịch hẹn mới từ khách hàng.</p>
        </div>
        <Link 
          href="/admin/history"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-admin-panel border border-admin-line-strong hover:border-admin-gold hover:text-admin-gold rounded-xl font-medium transition-all text-sm"
        >
          <Search size={16} /> Xem Lịch sử & Khách hàng
        </Link>
      </div>

      {/* Bookings List */}
      <div className="bg-admin-panel border border-admin-line-strong rounded-2xl shadow-[var(--shadow)] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-admin-text-dim">⏳ Đang tải danh sách đơn...</div>
        ) : bookings.length === 0 ? (
          <div className="p-10 text-center text-admin-text-dim">Chưa có đơn đặt lịch mới nào.</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-admin-panel-2 text-admin-text-dim border-b border-admin-line-strong">
                <tr>
                  <th className="p-4 font-semibold">Mã Đơn / Ngày Đặt</th>
                  <th className="p-4 font-semibold">Khách Hàng</th>
                  <th className="p-4 font-semibold">Thông tin hẹn</th>
                  <th className="p-4 font-semibold">Dịch vụ đã chọn</th>
                  <th className="p-4 font-semibold">Trạng Thái</th>
                  <th className="p-4 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-line">
                {bookings.map(booking => (
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
                        <Clock size={14} /> {booking.bookingTime || 'N/A'}
                      </div>
                      <div className="text-[13px] text-admin-text-dim mt-0.5">{booking.bookingDate || 'N/A'}</div>
                    </td>
                    <td className="p-4 max-w-[200px] truncate text-wrap">
                      <div className="text-sm line-clamp-2" title={booking.services ? JSON.stringify(booking.services) : 'N/A'}>
                        {/* Assuming services is an array or object, parse appropriately */}
                        {typeof booking.services === 'string' ? booking.services : 
                          (booking.services?.length ? `${booking.services.length} dịch vụ` : 'N/A')}
                      </div>
                      <div className="font-bold text-admin-green mt-1">
                        {booking.totalPrice ? booking.totalPrice.toLocaleString() + 'đ' : ''}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(booking.status || 'PENDING')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {booking.status === 'PENDING' && (
                          <button 
                            onClick={() => updateStatus(booking.id, 'CONFIRMED')}
                            className="p-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Xác nhận đơn"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => updateStatus(booking.id, 'COMPLETED')}
                          className="p-2 bg-admin-green-a text-admin-green hover:bg-admin-green-b rounded-lg transition-colors"
                          title="Đánh dấu hoàn thành"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => updateStatus(booking.id, 'CANCELLED')}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Hủy đơn"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
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

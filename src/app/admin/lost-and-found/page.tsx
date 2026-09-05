'use client';

import { useEffect, useState } from 'react';
import { ArchiveRestore, ArrowLeft, Check, CirclePlus, MapPin, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DEFAULT_LOST_AND_FOUND, normalizeLostAndFound, type LostAndFoundItem, type LostAndFoundStatus } from '@/lib/lostAndFound';

const STATUS: Record<LostAndFoundStatus, string> = { available: 'Đang giữ', contacting: 'Đang liên hệ', returned: 'Đã trả lại' };

export default function LostAndFoundAdminPage() {
  const [items, setItems] = useState<LostAndFoundItem[]>(DEFAULT_LOST_AND_FOUND.items);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(res => res.json())
      .then(data => setItems(normalizeLostAndFound(data.system_settings?.lost_and_found).items))
      .catch(() => {
        // The seeded demo remains available when the local configuration API is unavailable.
      });
  }, []);

  const update = (id: string, patch: Partial<LostAndFoundItem>) => setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  const saveItem = async (id: string) => {
    setSaving(id);
    try {
      await fetch('/api/admin/system-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_settings: { lost_and_found: { items } } }) });
    } finally { setSaving(null); }
  };
  const addItem = () => setItems(current => [...current, { id: `found-${Date.now()}`, type: 'other', title: { vi: 'Món đồ được giữ lại', en: 'An item held for its owner', jp: 'お預かりしている持ち物', kr: '주인을 위해 보관 중인 물건', cn: '等待失主认领的物品' }, detail: { vi: '', en: '', jp: '', kr: '', cn: '' }, foundAt: { vi: '', en: '', jp: '', kr: '', cn: '' }, foundOn: new Date().toISOString().slice(0, 10), status: 'available', image: '' }]);

  return <div className="p-6 lg:p-10 max-w-5xl mx-auto pb-24">
    <Link href="/admin" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-5"><ArrowLeft size={16} /> Quay lại Tổng quan</Link>
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-9">
      <div><p className="text-admin-gold text-xs font-bold tracking-[.18em] uppercase mb-2">Guest care</p><h1 className="text-3xl font-bold text-admin-text">Lost & Found</h1><p className="text-admin-text-dim mt-2">Cập nhật từng món đồ được khách để quên. Chỉ các món đang giữ mới hiện ở trang public.</p></div>
      <button onClick={addItem} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-admin-gold text-[#241804] font-bold"><CirclePlus size={17} /> Thêm món đồ</button>
    </div>
    <div className="space-y-5">{items.map(item => <article key={item.id} className="bg-admin-panel border border-admin-line-strong p-5 sm:p-6">
      <div className="flex justify-between gap-4 border-b border-admin-line pb-4 mb-5"><div className="flex gap-3 items-center"><ArchiveRestore size={19} className="text-admin-gold"/><strong className="text-admin-text">{item.title.vi || 'Món đồ chưa đặt tên'}</strong></div><button onClick={() => setItems(current => current.filter(currentItem => currentItem.id !== item.id))} className="text-admin-text-dim hover:text-red-400 p-1" title="Xóa món đồ"><Trash2 size={17}/></button></div>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <label className="text-sm text-admin-text-dim">Tên hiển thị (VI)<input value={item.title.vi} onChange={event => update(item.id, { title: { ...item.title, vi: event.target.value } })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim">Tên hiển thị (EN)<input value={item.title.en} onChange={event => update(item.id, { title: { ...item.title, en: event.target.value } })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim">Nơi tìm thấy<input value={item.foundAt.vi} onChange={event => update(item.id, { foundAt: { ...item.foundAt, vi: event.target.value } })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim">Ngày tìm thấy<input type="date" value={item.foundOn} onChange={event => update(item.id, { foundOn: event.target.value })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim sm:col-span-2">Ảnh món đồ (URL)<input value={item.image} onChange={event => update(item.id, { image: event.target.value })} placeholder="/images/lost-and-found/ten-anh.png" className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim sm:col-span-2">Ghi chú ngắn<textarea rows={2} value={item.detail.vi} onChange={event => update(item.id, { detail: { ...item.detail, vi: event.target.value } })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text resize-y" /></label>
      </div>
      <div className="mt-5 pt-4 border-t border-admin-line flex flex-wrap items-center justify-between gap-4"><div className="flex gap-2">{(Object.keys(STATUS) as LostAndFoundStatus[]).map(status => <button key={status} onClick={() => update(item.id, { status })} className={`px-3 py-1.5 text-xs rounded-full border ${item.status === status ? 'border-admin-gold bg-admin-gold-dim text-admin-gold' : 'border-admin-line text-admin-text-dim'}`}>{STATUS[status]}</button>)}</div><button onClick={() => saveItem(item.id)} disabled={saving === item.id} className="inline-flex gap-2 items-center text-sm font-bold text-admin-gold disabled:opacity-60"><Save size={16}/>{saving === item.id ? 'Đang lưu...' : 'Lưu món này'}</button></div>
    </article>)}</div>
  </div>;
}

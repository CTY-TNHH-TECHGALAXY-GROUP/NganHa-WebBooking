'use client';

import { useEffect, useState } from 'react';
import { ArchiveRestore, ArrowLeft, CirclePlus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DEFAULT_LOST_AND_FOUND, type LostAndFoundStatus } from '@/lib/lostAndFound';
import type { LostFoundClaimStatus, WebbookingLostFoundItem } from '@/lib/webbookingLostFound';

const ITEM_STATUS: Record<LostAndFoundStatus, string> = {
  available: 'Dang giu', contacting: 'Dang lien he', returned: 'Da tra lai',
};

const CLAIM_STATUS: Record<LostFoundClaimStatus, string> = {
  none: 'Chua co lien he', new: 'Lien he moi', contacted: 'Da phan hoi', resolved: 'Da xu ly', archived: 'Luu tru',
};

const createDraft = (): WebbookingLostFoundItem => ({
  id: `draft-${Date.now()}`,
  type: 'other',
  title: { vi: 'Mon do duoc giu lai', en: 'An item held for its owner', cn: '', jp: '', kr: '' },
  detail: { vi: '', en: '', cn: '', jp: '', kr: '' },
  foundAt: { vi: '', en: '', cn: '', jp: '', kr: '' },
  foundOn: new Date().toISOString().slice(0, 10),
  status: 'available', image: '', claimStatus: 'none',
});

export default function LostAndFoundAdminPage() {
  const [items, setItems] = useState<WebbookingLostFoundItem[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadItems = async () => {
    try {
      const response = await fetch('/api/admin/lost-and-found');
      const json = await response.json();
      if (!response.ok) throw new Error('Unable to load items');
      setItems(json.data || []);
    } catch {
      setItems(DEFAULT_LOST_AND_FOUND.items.map(item => ({ ...item, claimStatus: 'none' as const })));
      setMessage('Chua ket noi duoc bang WebbookingLostFound. Dang hien du lieu mau.');
    }
  };

  useEffect(() => { loadItems(); }, []);

  const update = (id: string, patch: Partial<WebbookingLostFoundItem>) => {
    setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const saveItem = async (item: WebbookingLostFoundItem) => {
    if (item.claimStatus !== 'none' && (!item.claimantName?.trim() || !item.claimNote?.trim() || !(item.claimantPhone?.trim() || item.claimantEmail?.trim()))) {
      setMessage('Lien he can co ten, dau hieu nhan dien va so dien thoai hoac email.');
      return;
    }

    setSaving(item.id);
    setMessage('');
    try {
      const isDraft = item.id.startsWith('draft-') || item.id.startsWith('found-');
      const response = await fetch(isDraft ? '/api/admin/lost-and-found' : `/api/admin/lost-and-found/${item.id}`, {
        method: isDraft ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const json = await response.json();
      if (!response.ok) throw new Error('Unable to save item');
      setItems(current => current.map(currentItem => currentItem.id === item.id ? json.data : currentItem));
      setMessage('Da luu mon do.');
    } catch {
      setMessage('Khong the luu. Hay kiem tra migration WebbookingLostFound va quyen admin.');
    } finally {
      setSaving(null);
    }
  };

  const removeItem = async (item: WebbookingLostFoundItem) => {
    if (!confirm('Ban co chac muon xoa mon do nay?')) return;
    if (!item.id.startsWith('draft-') && !item.id.startsWith('found-')) {
      const response = await fetch(`/api/admin/lost-and-found/${item.id}`, { method: 'DELETE' });
      if (!response.ok) {
        setMessage('Khong the xoa mon do.');
        return;
      }
    }
    setItems(current => current.filter(currentItem => currentItem.id !== item.id));
  };

  return <div className="p-6 lg:p-10 max-w-5xl mx-auto pb-24">
    <Link href="/admin" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-5"><ArrowLeft size={16} /> Quay lai Tong quan</Link>
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-9">
      <div><p className="text-admin-gold text-xs font-bold tracking-[.18em] uppercase mb-2">Guest care</p><h1 className="text-3xl font-bold text-admin-text">Lost & Found</h1><p className="text-admin-text-dim mt-2">Cap nhat mon do va lien he hien tai cua khach tren cung mot ban ghi.</p></div>
      <button onClick={() => setItems(current => [...current, createDraft()])} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-admin-gold text-[#241804] font-bold"><CirclePlus size={17} /> Them mon do</button>
    </div>
    {message && <p className="mb-5 text-sm text-admin-gold">{message}</p>}
    <div className="space-y-5">{items.map(item => <article key={item.id} className="bg-admin-panel border border-admin-line-strong p-5 sm:p-6">
      <div className="flex justify-between gap-4 border-b border-admin-line pb-4 mb-5"><div className="flex gap-3 items-center"><ArchiveRestore size={19} className="text-admin-gold"/><strong className="text-admin-text">{item.title.vi || 'Mon do chua dat ten'}</strong></div><button onClick={() => removeItem(item)} className="text-admin-text-dim hover:text-red-400 p-1" title="Xoa mon do"><Trash2 size={17}/></button></div>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <label className="text-sm text-admin-text-dim">Ten hien thi (VI)<input value={item.title.vi} onChange={event => update(item.id, { title: { ...item.title, vi: event.target.value } })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim">Ten hien thi (EN)<input value={item.title.en} onChange={event => update(item.id, { title: { ...item.title, en: event.target.value } })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim">Noi tim thay (VI)<input value={item.foundAt.vi} onChange={event => update(item.id, { foundAt: { ...item.foundAt, vi: event.target.value } })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim">Ngay tim thay<input type="date" value={item.foundOn} onChange={event => update(item.id, { foundOn: event.target.value })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim sm:col-span-2">Anh mon do (URL)<input value={item.image} onChange={event => update(item.id, { image: event.target.value })} placeholder="/images/lost-and-found/ten-anh.png" className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label>
        <label className="text-sm text-admin-text-dim sm:col-span-2">Ghi chu ngan<textarea rows={2} value={item.detail.vi} onChange={event => update(item.id, { detail: { ...item.detail, vi: event.target.value } })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text resize-y" /></label>
      </div>
      <div className="mt-5 pt-4 border-t border-admin-line grid sm:grid-cols-2 gap-4">
        <label className="text-sm text-admin-text-dim">Trang thai mon do<select value={item.status} onChange={event => update(item.id, { status: event.target.value as LostAndFoundStatus })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text">{Object.entries(ITEM_STATUS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className="text-sm text-admin-text-dim">Trang thai lien he<select value={item.claimStatus} onChange={event => update(item.id, { claimStatus: event.target.value as LostFoundClaimStatus })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text">{Object.entries(CLAIM_STATUS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        {item.claimStatus !== 'none' && <><label className="text-sm text-admin-text-dim">Ten nguoi lien he<input value={item.claimantName || ''} onChange={event => update(item.id, { claimantName: event.target.value })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label><label className="text-sm text-admin-text-dim">Dien thoai / Email<input value={item.claimantPhone || item.claimantEmail || ''} onChange={event => update(item.id, { claimantPhone: event.target.value, claimantEmail: '' })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text" /></label><label className="text-sm text-admin-text-dim sm:col-span-2">Dau hieu nhan dien<textarea rows={2} value={item.claimNote || ''} onChange={event => update(item.id, { claimNote: event.target.value })} className="mt-1.5 w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-admin-text resize-y" /></label></>}
      </div>
      <div className="mt-5 flex justify-end"><button onClick={() => saveItem(item)} disabled={saving === item.id} className="inline-flex gap-2 items-center text-sm font-bold text-admin-gold disabled:opacity-60"><Save size={16}/>{saving === item.id ? 'Dang luu...' : 'Luu mon nay'}</button></div>
    </article>)}</div>
  </div>;
}

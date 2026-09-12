'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, RefreshCw, Save, ShieldCheck } from 'lucide-react';

type Capability = string;

type Editor = {
  user_id: string;
  email: string | null;
  role: 'editor';
  is_active: boolean;
  updated_at: string | null;
  revision: number;
  grants: Array<{ capability: Capability; scope: string }>;
};

const GROUPS: Array<{ label: string; keys: string[] }> = [
  { label: 'Content', keys: ['content.read', 'content.write', 'content.publish'] },
  { label: 'Media', keys: ['media.read', 'media.upload', 'media.delete'] },
  { label: 'Services', keys: ['services.read', 'services.write'] },
  { label: 'Analytics', keys: ['analytics.read'] },
  { label: 'SEO', keys: ['seo.read', 'seo.write', 'seo.publish'] },
  { label: 'AEO', keys: ['aeo.read', 'aeo.write', 'aeo.publish'] },
  { label: 'Lost & Found (customer data)', keys: ['lost_found.read', 'lost_found.write', 'lost_found.delete'] },
];

function initialCapabilities(editor: Editor) {
  return new Set(editor.grants.map((grant) => grant.capability));
}

export default function EditorPermissionsPage() {
  const [editors, setEditors] = useState<Editor[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [revisions, setRevisions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const allKeys = useMemo(() => GROUPS.flatMap((group) => group.keys), []);

  const loadEditors = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/editor-permissions', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error?.message || 'Không thể tải capability');

      const nextEditors = (json.data?.editors || []) as Editor[];
      setEditors(nextEditors);
      setDrafts(Object.fromEntries(nextEditors.map((editor) => [
        editor.user_id,
        [...initialCapabilities(editor)].filter((key) => allKeys.includes(key)),
      ])));
      setRevisions(Object.fromEntries(nextEditors.map((editor) => [editor.user_id, editor.revision || 1])));
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Không thể tải capability', error: true });
    } finally {
      setLoading(false);
    }
  }, [allKeys]);

  useEffect(() => {
    void loadEditors();
  }, [loadEditors]);

  const toggleCapability = (userId: string, capability: string) => {
    setDrafts((current) => {
      const selected = new Set(current[userId] || []);
      if (selected.has(capability)) selected.delete(capability);
      else selected.add(capability);
      return { ...current, [userId]: [...selected] };
    });
  };

  const saveEditor = async (editor: Editor) => {
    setSaving(editor.user_id);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/editor-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editor.user_id,
          capabilities: drafts[editor.user_id] || [],
          expected_revision: revisions[editor.user_id] || 1,
        }),
      });
      const json = await response.json();
      if (response.status === 409 || json.error?.code === 'PERMISSION_CONFLICT') {
        setMessage({ text: 'Quyền editor vừa được thay đổi ở cửa sổ khác. Hãy tải lại danh sách trước khi lưu lại.', error: true });
        return;
      }
      if (!response.ok || !json.success) throw new Error(json.error?.message || 'Không thể lưu capability');

      if (typeof json.data?.revision === 'number') {
        setRevisions((current) => ({ ...current, [editor.user_id]: json.data.revision }));
      }
      if (Array.isArray(json.data?.capabilities)) {
        setDrafts((current) => ({
          ...current,
          [editor.user_id]: json.data.capabilities.filter((key: unknown): key is string => allKeys.includes(key as string)),
        }));
      }
      setMessage({ text: `Đã cập nhật quyền cho ${editor.email || editor.user_id}` });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Không thể lưu capability', error: true });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-admin-text-dim">Đang tải capability...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-10">
      <header className="flex flex-col gap-4 border-b border-admin-line pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-admin-text">
            <ShieldCheck className="text-admin-gold" />
            Editor permissions
          </h1>
          <p className="mt-2 text-sm text-admin-text-dim">Chỉ owner/admin có thể thay đổi grants. Thay đổi có hiệu lực ở request kế tiếp.</p>
        </div>
        <button
          type="button"
          onClick={loadEditors}
          title="Tải lại danh sách editor"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-admin-line px-4 py-2 text-sm font-semibold text-admin-text hover:bg-admin-line"
        >
          <RefreshCw size={16} />
          Tải lại
        </button>
      </header>

      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${message.error ? 'border-red-900/60 bg-red-950/30 text-red-200' : 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'}`}>
          {message.text}
        </div>
      )}

      {editors.length === 0 ? (
        <div className="rounded-xl border border-admin-line bg-admin-panel p-8 text-center text-admin-text-dim">
          Chưa có tài khoản editor trong WebbookingAdminUsers.
        </div>
      ) : (
        <div className="space-y-5">
          {editors.map((editor) => {
            const selected = new Set(drafts[editor.user_id] || []);
            const isSaving = saving === editor.user_id;
            return (
              <section key={editor.user_id} className="rounded-xl border border-admin-line bg-admin-panel p-5 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-admin-line pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-admin-text">{editor.email || editor.user_id}</h2>
                    <p className="mt-1 text-xs text-admin-text-faint">
                      {editor.is_active ? 'Active editor' : 'Inactive membership'} · {editor.user_id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveEditor(editor)}
                    disabled={isSaving || !editor.is_active}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-admin-gold px-4 py-2 text-sm font-semibold text-[#241804] transition-colors hover:bg-[#a67433] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    Lưu thay đổi
                  </button>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {GROUPS.map((group) => (
                    <fieldset key={group.label} className="rounded-lg border border-admin-line p-4">
                      <legend className="px-1 text-sm font-semibold text-admin-gold">{group.label}</legend>
                      <div className="mt-2 space-y-2">
                        {group.keys.map((capability) => (
                          <label key={capability} className="flex cursor-pointer items-center gap-3 text-sm text-admin-text-dim">
                            <input
                              type="checkbox"
                              checked={selected.has(capability)}
                              onChange={() => toggleCapability(editor.user_id, capability)}
                              disabled={!editor.is_active || isSaving}
                              className="h-4 w-4 accent-admin-gold"
                            />
                            <span className="flex-1">{capability}</span>
                            {selected.has(capability) && <Check size={15} className="text-admin-gold" />}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

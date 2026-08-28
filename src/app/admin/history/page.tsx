'use client';

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit3, Image as ImageIcon, ArrowLeft, ChevronDown, ChevronRight, Download } from 'lucide-react';
import Link from 'next/link';
import { chaptersVi, chaptersEn } from '@/components/History/History';

// Helper component for multi-language input
const MultiLangInput = ({ 
  label, 
  value, 
  onChange, 
  multiline = false 
}: { 
  label: string; 
  value: Record<string, string> | undefined; 
  onChange: (val: Record<string, string>) => void;
  multiline?: boolean;
}) => {
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  const handleChange = (text: string) => {
    onChange({ ...(value || {}), [lang]: text });
  };

  return (
    <div className="mb-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-semibold text-gray-800">{label}</label>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            type="button" 
            onClick={() => setLang('vi')} 
            className={`px-3 py-1 text-xs font-bold rounded-md ${lang === 'vi' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tiếng Việt
          </button>
          <button 
            type="button" 
            onClick={() => setLang('en')} 
            className={`px-3 py-1 text-xs font-bold rounded-md ${lang === 'en' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            English
          </button>
        </div>
      </div>
      {multiline ? (
        <textarea
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]"
          value={value?.[lang] || ''}
          onChange={e => handleChange(e.target.value)}
          placeholder={`Nhập ${lang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'}...`}
        />
      ) : (
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          value={value?.[lang] || ''}
          onChange={e => handleChange(e.target.value)}
          placeholder={`Nhập ${lang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'}...`}
        />
      )}
    </div>
  );
};

export default function BrandHistoryPage() {
  const [config, setConfig] = useState<any>({
    hero: {
      image: '/images/about-bg.png',
      eyebrow: { vi: 'Hành trình đáng dõi theo', en: 'A story worth following' },
      title1: { vi: 'Lịch Sử', en: 'Our' },
      title2: { vi: 'Ngân Hà', en: 'History' },
      body: { vi: 'Từ một không gian nhỏ ban đầu đến một điểm đến spa chỉn chu hơn, mỗi cột mốc đều giữ cùng một lời hứa: chăm sóc tốt hơn, đón tiếp ấm hơn và trải nghiệm bình yên hơn.', en: 'From a humble beginning to a refined spa destination, every milestone carries the same promise: better care, warmer hospitality, and a more peaceful experience.' }
    },
    finale: {
      eyebrow: { vi: 'Câu chuyện còn tiếp tục', en: 'The story continues' },
      title: { vi: 'Ít cảm giác giao diện hơn. Nhiều cảm xúc hơn.', en: 'Less interface. More feeling.' },
      body: { vi: 'Lịch sử trở thành một hành trình điện ảnh nhẹ nhàng qua thương hiệu, con người và những không gian đã tạo nên Ngân Hà.', en: 'History becomes a quiet cinematic journey through the brand, its people, and its spaces.' }
    },
    chapters: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(res => res.json())
      .then(data => {
        if (data.brand_history && data.brand_history.hero && data.brand_history.chapters) {
          setConfig(data.brand_history);
        } else if (data.brand_history && Array.isArray(data.brand_history) && data.brand_history.length > 0) {
          // Backward compatibility if it was just an array
          setConfig((prev: any) => ({ ...prev, chapters: data.brand_history }));
        } else {
          // Auto-seed from hardcoded data if DB is empty
          const seedData = chaptersVi.map((chVi, index) => {
            const chEn = chaptersEn[index] || chVi;
            return {
              id: Date.now().toString() + index,
              year: chVi.year,
              eyebrow: { vi: chVi.eyebrow, en: chEn.eyebrow },
              title: { vi: chVi.title, en: chEn.title },
              body: { vi: chVi.body, en: chEn.body },
              meta: { vi: chVi.meta, en: chEn.meta },
              scenes: chVi.scenes.map((scVi, sIdx) => {
                const scEn = chEn.scenes[sIdx] || scVi;
                return {
                  id: Date.now().toString() + index + sIdx,
                  title: { vi: scVi.title, en: scEn.title },
                  label: { vi: scVi.label, en: scEn.label },
                  body: { vi: scVi.body, en: scEn.body },
                  image: scVi.image,
                  alt: { vi: scVi.alt, en: scEn.alt }
                };
              })
            };
          });
          setConfig((prev: any) => ({ ...prev, chapters: seedData }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_history: config }),
      });
      if (res.ok) {
        setMessage('Lưu Lịch sử thương hiệu thành công!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi lưu.');
      }
    } catch (e) {
      setMessage('Có lỗi xảy ra khi lưu.');
    }
    setSaving(false);
  };

  const addChapter = () => {
    const newChapter = {
      id: Date.now().toString(),
      year: new Date().getFullYear().toString(),
      eyebrow: { vi: 'Cột mốc mới', en: 'New Milestone' },
      title: { vi: '', en: '' },
      body: { vi: '', en: '' },
      meta: { vi: [], en: [] },
      scenes: []
    };
    setConfig({ ...config, chapters: [...config.chapters, newChapter] });
    setExpandedChapter(newChapter.id);
  };

  const updateChapter = (index: number, updatedChapter: any) => {
    const newChapters = [...config.chapters];
    newChapters[index] = updatedChapter;
    setConfig({ ...config, chapters: newChapters });
  };

  const deleteChapter = (index: number) => {
    if (!confirm('Bạn có chắc muốn xóa cột mốc năm này không?')) return;
    const newChapters = [...config.chapters];
    newChapters.splice(index, 1);
    setConfig({ ...config, chapters: newChapters });
  };

  const addScene = (chapterIndex: number) => {
    const newChapters = [...config.chapters];
    const newScene = {
      id: Date.now().toString(),
      title: { vi: '', en: '' },
      label: { vi: '', en: '' },
      body: { vi: '', en: '' },
      image: '',
      alt: { vi: '', en: '' }
    };
    if (!newChapters[chapterIndex].scenes) newChapters[chapterIndex].scenes = [];
    newChapters[chapterIndex].scenes.push(newScene);
    setConfig({ ...config, chapters: newChapters });
  };

  const updateScene = (chapterIndex: number, sceneIndex: number, updatedScene: any) => {
    const newChapters = [...config.chapters];
    newChapters[chapterIndex].scenes[sceneIndex] = updatedScene;
    setConfig({ ...config, chapters: newChapters });
  };

  const deleteScene = (chapterIndex: number, sceneIndex: number) => {
    if (!confirm('Bạn có chắc muốn xóa cảnh (scene) này không?')) return;
    const newChapters = [...config.chapters];
    newChapters[chapterIndex].scenes.splice(sceneIndex, 1);
    setConfig({ ...config, chapters: newChapters });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải cấu hình...</div>;

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto pb-24">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">📖 Cấu Hình Lịch Sử Thương Hiệu</h1>
            <p className="text-admin-text-dim mt-2">Quản lý các cột mốc thời gian (Our Story) của Spa trên trang chủ.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {message && (
              <span className={`text-sm font-medium ${message.includes('thành công') ? 'text-admin-green' : 'text-red-600'}`}>
                {message}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* HERO CONFIG */}
        <div className="bg-admin-panel border border-admin-line-strong rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 p-5 bg-admin-bg/50 border-b border-admin-line-strong">
            <ImageIcon className="text-admin-gold" />
            <h2 className="text-xl font-bold text-admin-text">Phần Mở Đầu (Hero Banner)</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">Hình ảnh nền (Background)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 mb-2"
                value={config.hero.image || ''}
                onChange={e => setConfig({ ...config, hero: { ...config.hero, image: e.target.value } })}
                placeholder="Nhập đường dẫn ảnh..."
              />
              {config.hero.image && (
                <div className="mt-2 w-full h-32 relative rounded-lg overflow-hidden border border-gray-200">
                  <img src={config.hero.image} alt="Hero Background" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">Eyebrow (Chữ nhỏ phía trên)</label>
                <MultiLangInput
                  label=""
                  value={config.hero.eyebrow}
                  onChange={(val) => setConfig({ ...config, hero: { ...config.hero, eyebrow: val } })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">Tiêu đề chính 1</label>
                <MultiLangInput
                  label=""
                  value={config.hero.title1}
                  onChange={(val) => setConfig({ ...config, hero: { ...config.hero, title1: val } })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">Tiêu đề chính 2 (In nghiêng)</label>
                <MultiLangInput
                  label=""
                  value={config.hero.title2}
                  onChange={(val) => setConfig({ ...config, hero: { ...config.hero, title2: val } })}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-admin-text mb-2">Mô tả ngắn (Body)</label>
              <MultiLangInput
                label=""
                value={config.hero.body}
                onChange={(val) => setConfig({ ...config, hero: { ...config.hero, body: val } })}
                multiline
              />
            </div>
          </div>
        </div>

        {/* TIMELINE CHAPTERS */}
        <h2 className="text-xl font-bold text-admin-text mt-8 pt-4 border-t border-admin-line-strong">Các Cột Mốc Thời Gian (Timeline)</h2>
        
        {config.chapters.map((chapter: any, chapIdx: number) => (
          <div key={chapter.id || chapIdx} className="bg-admin-panel border border-admin-line-strong rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div 
              className="flex items-center justify-between p-5 bg-admin-bg/50 cursor-pointer hover:bg-admin-line transition-colors"
              onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
            >
              <div className="flex items-center gap-4">
                {expandedChapter === chapter.id ? <ChevronDown className="text-admin-gold" /> : <ChevronRight className="text-admin-gold" />}
                <h2 className="text-xl font-bold text-admin-text flex items-center gap-3">
                  <span className="bg-admin-gold-dim text-admin-gold px-3 py-1 rounded-lg border border-admin-gold/30">
                    Năm {chapter.year}
                  </span>
                  {chapter.title?.vi || 'Chưa có tiêu đề'}
                </h2>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChapter(chapIdx); }}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa cột mốc năm này"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Content */}
            {expandedChapter === chapter.id && (
              <div className="p-6 border-t border-admin-line-strong">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Năm (Year)</label>
                    <input
                      type="text"
                      className="w-full md:w-1/3 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                      value={chapter.year || ''}
                      onChange={e => updateChapter(chapIdx, { ...chapter, year: e.target.value })}
                      placeholder="VD: 2015"
                    />
                  </div>

                  <MultiLangInput
                    label="Nhãn phụ (Eyebrow)"
                    value={chapter.eyebrow}
                    onChange={val => updateChapter(chapIdx, { ...chapter, eyebrow: val })}
                  />
                  <MultiLangInput
                    label="Tiêu đề chính (Title)"
                    value={chapter.title}
                    onChange={val => updateChapter(chapIdx, { ...chapter, title: val })}
                  />
                  <div className="md:col-span-2">
                    <MultiLangInput
                      label="Mô tả nội dung (Body)"
                      value={chapter.body}
                      multiline
                      onChange={val => updateChapter(chapIdx, { ...chapter, body: val })}
                    />
                  </div>
                </div>

                <hr className="border-admin-line-strong mb-6" />

                <h3 className="text-lg font-bold text-admin-text flex items-center gap-2 mb-4">
                  <ImageIcon className="text-admin-gold" size={20} /> Các Cảnh (Scenes / Hình ảnh)
                </h3>

                <div className="space-y-6">
                  {chapter.scenes?.map((scene: any, sceneIdx: number) => (
                    <div key={scene.id || sceneIdx} className="bg-admin-bg p-5 rounded-xl border border-admin-line relative group">
                      <button
                        onClick={() => deleteScene(chapIdx, sceneIdx)}
                        className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa cảnh này"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 mb-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">URL Hình ảnh</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={scene.image || ''}
                            onChange={e => updateScene(chapIdx, sceneIdx, { ...scene, image: e.target.value })}
                            placeholder="/images/history/2015..."
                          />
                        </div>
                        
                        <MultiLangInput
                          label="Tên Cảnh (Label)"
                          value={scene.label}
                          onChange={val => updateScene(chapIdx, sceneIdx, { ...scene, label: val })}
                        />
                        <MultiLangInput
                          label="Tiêu đề Ảnh (Title)"
                          value={scene.title}
                          onChange={val => updateScene(chapIdx, sceneIdx, { ...scene, title: val })}
                        />
                        <div className="md:col-span-2">
                          <MultiLangInput
                            label="Mô tả Ảnh (Body)"
                            value={scene.body}
                            multiline
                            onChange={val => updateScene(chapIdx, sceneIdx, { ...scene, body: val })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addScene(chapIdx)}
                    className="w-full py-3 border-2 border-dashed border-admin-gold text-admin-gold rounded-xl hover:bg-admin-gold-dim font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={18} /> Thêm Hình ảnh / Cảnh mới cho Năm {chapter.year}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addChapter}
        className="mt-8 px-6 py-4 w-full bg-admin-panel border border-admin-line-strong hover:border-admin-gold text-admin-text-dim hover:text-admin-gold rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <Plus size={20} /> Thêm Cột Mốc Năm Mới
      </button>

      {/* FINALE CONFIGURATION */}
      <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm mt-12 mb-8">
        <h2 className="text-xl font-bold text-admin-text mb-6 flex items-center gap-2">
          <Edit3 className="text-admin-gold" />
          Phần Kết (Finale)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MultiLangInput
            label="Tiêu đề phụ (Eyebrow)"
            value={config.finale?.eyebrow}
            onChange={val => setConfig({ ...config, finale: { ...config.finale, eyebrow: val } })}
          />
          <MultiLangInput
            label="Tiêu đề chính (Title)"
            value={config.finale?.title}
            onChange={val => setConfig({ ...config, finale: { ...config.finale, title: val } })}
          />
        </div>
        <MultiLangInput
          label="Mô tả kết (Body)"
          value={config.finale?.body}
          multiline
          onChange={val => setConfig({ ...config, finale: { ...config.finale, body: val } })}
        />
      </div>
    </div>
  );
}

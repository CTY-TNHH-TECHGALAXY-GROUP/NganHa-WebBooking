'use client';

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, Globe, LayoutTemplate, MessageCircle } from 'lucide-react';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
];

const DEFAULT_CONTENT = {
  hero: {
    companyName: { vi: 'TechGalaxy Group', en: 'TechGalaxy Group', kr: 'TechGalaxy Group', jp: 'TechGalaxy Group', cn: 'TechGalaxy Group' },
    subtitle: { vi: '', en: '', kr: '', jp: '', cn: '' },
    tagline: { vi: '', en: '', kr: '', jp: '', cn: '' }
  },
  bestSeller: {
    eyebrow: { vi: 'Đặt nhiều nhất tháng này', en: 'Most booked this month', kr: '이번 달 가장 많이 예약됨', jp: '今月最も予約された', cn: '本月预订最多' },
    title1: { vi: 'Bán chạy nhất tại', en: 'Best-seller of', kr: '베스트셀러', jp: 'のベストセラー', cn: '最畅销' },
    title2: { vi: 'Oria Spa', en: 'Oria Spa', kr: 'Oria Spa', jp: 'Oria Spa', cn: 'Oria Spa' }
  },
  services: {
    eyebrow: { vi: 'Menu Dịch Vụ', en: 'Service Menu', kr: '서비스 메뉴', jp: 'サービスメニュー', cn: '服务菜单' },
    title: { vi: 'Lật từng trang để chọn đúng trải nghiệm bạn muốn', en: 'Flip the pages to find your perfect experience', kr: '원하는 경험을 찾으려면 페이지를 넘기세요', jp: 'ページをめくって完璧な体験を見つけてください', cn: '翻开页面寻找您的完美体验' },
    subtitle: { vi: 'Hãy chọn cho mình một dịch vụ hoàn hảo và thư giãn.', en: 'Choose a perfect and relaxing service for yourself.', kr: '자신에게 완벽하고 편안한 서비스를 선택하세요.', jp: '自分にとって完璧でリラックスできるサービスをお選びください。', cn: '为自己选择一个完美放松的服务。' },
    hintText: { vi: 'Bạn có thể nhấp vào nút dưới đây để tiếp tục.', en: 'You can click the button below to continue.', kr: '계속하려면 아래 버튼을 클릭하세요.', jp: '続行するには下のボタンをクリックしてください。', cn: '您可以点击下面的按钮继续。' },
    cta: { vi: 'Đi tới bước đặt lịch', en: 'Proceed to booking', kr: '예약 진행', jp: '予約に進む', cn: '前往预订' }
  },
  navigation: {
    spaces: { vi: 'Không gian', en: 'Spaces', kr: '공간', jp: 'スペース', cn: '空间' },
    welcomeArea: { vi: 'Khu vực đón khách', en: 'Welcome area', kr: '환영 공간', jp: 'ウェルカムエリア', cn: '欢迎区' },
    firstFloor: { vi: 'Tầng một', en: 'First Floor', kr: '1층', jp: '1階', cn: '一楼' },
    secondFloor: { vi: 'Tầng hai', en: 'Second Floor', kr: '2층', jp: '2階', cn: '二楼' },
    
    services: { vi: 'Dịch vụ', en: 'Services', kr: '서비스', jp: 'サービス', cn: '服务' },
    pureRelaxation: { vi: 'Thư giãn thuần túy', en: 'Pure relaxation', kr: '순수한 휴식', jp: '純粋なリラクゼーション', cn: '纯粹放松' },
    designJourney: { vi: 'Thiết kế hành trình', en: 'Design Your Journey', kr: '여정 디자인', jp: 'あなたの旅をデザイン', cn: '设计您的旅程' },
    therapy: { vi: 'Trị liệu', en: 'Therapy', kr: '치료', jp: 'セラピー', cn: '治疗' },
    
    academy: { vi: 'Học viện', en: 'Academy', kr: '아카데미', jp: 'アカデミー', cn: '学院' },
    admissions: { vi: 'Tuyển sinh', en: 'Recruitment/Admission', kr: '모집/입학', jp: '募集・入学', cn: '招聘/入学' },
    training: { vi: 'Đào tạo trực tuyến', en: 'Training / Online', kr: '온라인 교육', jp: 'オンライントレーニング', cn: '培训 / 在线' },
    certification: { vi: 'Chứng nhận', en: 'Certification', kr: '인증', jp: '認証', cn: '认证' },
    
    localTour: { vi: 'Tour địa phương', en: 'Local tour', kr: '지역 투어', jp: 'ローカルツアー', cn: '本地游' },
    lostAndFound: { vi: 'Đồ thất lạc', en: 'Lost & Found', kr: '분실물 센터', jp: '忘れ物', cn: '失物招领' },
    history: { vi: 'Lịch sử', en: 'History', kr: '역사', jp: '歴史', cn: '历史' },
    privileges: { vi: 'Đặc quyền của bạn', en: 'Your privileges', kr: '당신의 특권', jp: 'あなたの特권', cn: '您的特权' },
    blogs: { vi: 'Bài viết', en: 'Blogs', kr: '블로그', jp: 'ブログ', cn: '博客' },
    
    bgImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2940&auto=format&fit=crop'
  },
  chat: {
    greeting: {
      vi: 'Oria Xin Chào. Đội ngũ của chúng\ntôi sẵn sàng trả lời bạn ngay bây giờ ✨',
      en: 'Hello from Oria. Our team is available to answer you now ✨',
      kr: 'Oria 안녕하세요. 저희 팀이 지금 답변해 드릴 수 있습니다 ✨',
      jp: 'Oriaからこんにちは。スタッフがすぐにお答えします ✨',
      cn: 'Oria 您好。我们的团队随时为您解答 ✨'
    }
  }
};

export default function HomepageContentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeLang, setActiveLang] = useState('vi');
  
  const [content, setContent] = useState<any>(DEFAULT_CONTENT);

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(res => res.json())
      .then(data => {
        if (data.homepage_content) {
          // Merge with default to ensure all fields exist
          setContent({
            hero: { ...DEFAULT_CONTENT.hero, ...(data.homepage_content.hero || {}) },
            bestSeller: { ...DEFAULT_CONTENT.bestSeller, ...(data.homepage_content.bestSeller || {}) },
            services: { ...DEFAULT_CONTENT.services, ...(data.homepage_content.services || {}) },
            navigation: { ...DEFAULT_CONTENT.navigation, ...(data.homepage_content.navigation || {}) },
            chat: { ...DEFAULT_CONTENT.chat, ...(data.homepage_content.chat || {}) },
          });
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
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homepage_content: content }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Lưu nội dung trang chủ thành công!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu.' });
    }
    setSaving(false);
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          [activeLang]: value
        }
      }
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-admin-text-dim">Đang tải cấu hình...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-admin-panel border border-admin-line p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-admin-text flex items-center gap-2">
            <LayoutTemplate className="text-admin-gold" />
            Nội Dung Trang Chủ
          </h1>
          <p className="text-admin-text-dim mt-2">Quản lý nội dung văn bản trên trang chủ đa ngôn ngữ.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 shadow-md"
        >
          {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 font-medium ${message.type === 'success' ? 'bg-admin-green-a border-admin-green-b text-admin-green border' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Language Tabs */}
      <div className="bg-admin-panel border border-admin-line p-2 rounded-2xl shadow-sm flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setActiveLang(lang.code)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              activeLang === lang.code
                ? 'bg-admin-gold text-[#241804] shadow-md'
                : 'bg-admin-background hover:bg-admin-line text-admin-text-dim'
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            {lang.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Hero Banner */}
        <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-admin-text mb-6 pb-4 border-b border-admin-line flex items-center gap-2">
            1. Hero Banner
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">Tên công ty (Company Name)</label>
              <input
                type="text"
                value={content.hero.companyName?.[activeLang] || ''}
                onChange={(e) => handleInputChange('hero', 'companyName', e.target.value)}
                className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
                placeholder="VD: TechGalaxy Group"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">Phụ đề (Subtitle - Tùy chọn)</label>
              <input
                type="text"
                value={content.hero.subtitle?.[activeLang] || ''}
                onChange={(e) => handleInputChange('hero', 'subtitle', e.target.value)}
                className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
                placeholder="VD: Chào mừng đến với"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">Tagline (Tùy chọn)</label>
              <input
                type="text"
                value={content.hero.tagline?.[activeLang] || ''}
                onChange={(e) => handleInputChange('hero', 'tagline', e.target.value)}
                className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
                placeholder="VD: Trải nghiệm thư giãn tuyệt đối"
              />
            </div>
          </div>
        </div>

        {/* Section: Best Seller */}
        <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-admin-text mb-6 pb-4 border-b border-admin-line flex items-center gap-2">
            2. Best Seller
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">Mũi giày (Eyebrow)</label>
              <input
                type="text"
                value={content.bestSeller.eyebrow?.[activeLang] || ''}
                onChange={(e) => handleInputChange('bestSeller', 'eyebrow', e.target.value)}
                className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">Tiêu đề dòng 1 (Title 1)</label>
              <input
                type="text"
                value={content.bestSeller.title1?.[activeLang] || ''}
                onChange={(e) => handleInputChange('bestSeller', 'title1', e.target.value)}
                className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">Tiêu đề dòng 2 (Title 2 - Brand)</label>
              <input
                type="text"
                value={content.bestSeller.title2?.[activeLang] || ''}
                onChange={(e) => handleInputChange('bestSeller', 'title2', e.target.value)}
                className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section: Service Menu */}
        <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-admin-text mb-6 pb-4 border-b border-admin-line flex items-center gap-2">
            3. Service Menu (Sổ menu)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">Mũi giày (Eyebrow)</label>
                <input
                  type="text"
                  value={content.services.eyebrow?.[activeLang] || ''}
                  onChange={(e) => handleInputChange('services', 'eyebrow', e.target.value)}
                  className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">Tiêu đề (Title)</label>
                <input
                  type="text"
                  value={content.services.title?.[activeLang] || ''}
                  onChange={(e) => handleInputChange('services', 'title', e.target.value)}
                  className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">Mô tả (Subtitle)</label>
                <textarea
                  value={content.services.subtitle?.[activeLang] || ''}
                  onChange={(e) => handleInputChange('services', 'subtitle', e.target.value)}
                  className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">Gợi ý thao tác (Hint Text)</label>
                <input
                  type="text"
                  value={content.services.hintText?.[activeLang] || ''}
                  onChange={(e) => handleInputChange('services', 'hintText', e.target.value)}
                  className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">Nút Call To Action (CTA)</label>
                <input
                  type="text"
                  value={content.services.cta?.[activeLang] || ''}
                  onChange={(e) => handleInputChange('services', 'cta', e.target.value)}
                  className="w-full bg-admin-background border border-admin-line rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Menu Navigation */}
      <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-admin-text mb-6 pb-4 border-b border-admin-line flex items-center gap-2">
          4. Menu Điều Hướng (Navigation)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Cột 1: Spaces */}
          <div className="space-y-4">
            <h3 className="font-bold text-admin-gold uppercase tracking-wider text-sm mb-4 border-b border-admin-line pb-2">SPACES</h3>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Tiêu đề (Spaces)</label>
              <input type="text" value={content.navigation.spaces?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'spaces', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Welcome area</label>
              <input type="text" value={content.navigation.welcomeArea?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'welcomeArea', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">First Floor</label>
              <input type="text" value={content.navigation.firstFloor?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'firstFloor', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Second Floor</label>
              <input type="text" value={content.navigation.secondFloor?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'secondFloor', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
          </div>

          {/* Cột 2: Services */}
          <div className="space-y-4">
            <h3 className="font-bold text-admin-gold uppercase tracking-wider text-sm mb-4 border-b border-admin-line pb-2">SERVICES</h3>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Tiêu đề (Services)</label>
              <input type="text" value={content.navigation.services?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'services', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Pure relaxation</label>
              <input type="text" value={content.navigation.pureRelaxation?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'pureRelaxation', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Design Your Journey</label>
              <input type="text" value={content.navigation.designJourney?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'designJourney', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Therapy</label>
              <input type="text" value={content.navigation.therapy?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'therapy', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
          </div>

          {/* Cột 3: Academy */}
          <div className="space-y-4">
            <h3 className="font-bold text-admin-gold uppercase tracking-wider text-sm mb-4 border-b border-admin-line pb-2">ACADEMY</h3>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Tiêu đề (Academy)</label>
              <input type="text" value={content.navigation.academy?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'academy', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Recruitment/Admission</label>
              <input type="text" value={content.navigation.admissions?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'admissions', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Training / Online</label>
              <input type="text" value={content.navigation.training?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'training', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Certification</label>
              <input type="text" value={content.navigation.certification?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'certification', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
          </div>

          {/* Cột 4: Other Links */}
          <div className="space-y-4">
            <h3 className="font-bold text-admin-gold uppercase tracking-wider text-sm mb-4 border-b border-admin-line pb-2">KHÁC</h3>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Local tour</label>
              <input type="text" value={content.navigation.localTour?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'localTour', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Lost & Found</label>
              <input type="text" value={content.navigation.lostAndFound?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'lostAndFound', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Your privileges</label>
              <input type="text" value={content.navigation.privileges?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'privileges', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">History</label>
              <input type="text" value={content.navigation.history?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'history', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
            <div>
              <label className="block text-xs text-admin-text-dim mb-1">Blogs</label>
              <input type="text" value={content.navigation.blogs?.[activeLang] || ''} onChange={(e) => handleInputChange('navigation', 'blogs', e.target.value)} className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" />
            </div>
          </div>
        </div>

        {/* Cột 5: Background Image */}
        <div className="mt-8 border-t border-admin-line pt-6">
          <h3 className="font-bold text-admin-gold uppercase tracking-wider text-sm mb-4">ẢNH NỀN MENU (Tất cả ngôn ngữ dùng chung)</h3>
          <div className="w-full">
            <label className="block text-xs text-admin-text-dim mb-1">URL Ảnh nền (Nên chọn ảnh chất lượng cao dọc hoặc ngang lớn)</label>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={content.navigation.bgImage || ''} 
                onChange={(e) => {
                  setContent((prev: any) => ({
                    ...prev,
                    navigation: {
                      ...prev.navigation,
                      bgImage: e.target.value
                    }
                  }));
                }} 
                className="flex-1 bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text" 
                placeholder="https://..."
              />
            </div>
            {content.navigation.bgImage && (
              <div className="mt-4 border border-admin-line rounded-lg overflow-hidden w-64 h-40 relative">
                <img src={content.navigation.bgImage} alt="Menu Background Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Phần 5: Chatbot */}
        <div className="mt-12 bg-admin-card p-6 rounded-xl border border-admin-line">
          <h2 className="text-lg font-bold text-admin-gold mb-6 flex items-center gap-2">
            <MessageCircle size={20} />
            5. Cấu Hình Chatbot
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-admin-text mb-2">Câu chào hiển thị (Tự động xuống dòng khi text dài)</label>
              <textarea 
                value={content.chat?.greeting?.[activeLang] || ''} 
                onChange={(e) => handleInputChange('chat', 'greeting', e.target.value)} 
                className="w-full bg-admin-background border border-admin-line rounded-lg px-3 py-2 text-sm text-admin-text min-h-[100px]"
                placeholder="VD: Oria Xin Chào..."
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

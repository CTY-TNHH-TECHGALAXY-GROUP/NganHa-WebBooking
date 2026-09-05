'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Ear, Glasses, MapPin, ScanLine, Sparkles, Watch } from 'lucide-react';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { useTranslation } from '@/components/TranslationProvider';
import { getLostAndFoundText, normalizeLostAndFound, type LostAndFoundItem } from '@/lib/lostAndFound';
import styles from './LostAndFoundPage.module.css';

const COPY = {
  vi: { eyebrow: 'Lost & Found', title: 'Đồ của bạn vẫn đang chờ bạn.', intro: 'Những món đồ được tìm thấy tại Oria sẽ được giữ lại cẩn thận trong một khoảng thời gian ngắn. Nếu bạn nhận ra một món đồ, hãy để lại lời nhắn để đội ngũ chuẩn bị cuộc gặp lại.', available: 'Đang được giữ', contacting: 'Đang liên hệ', found: 'Tìm thấy tại', contact: 'Liên hệ với Oria Spa', contactTitle: 'Hãy cho chúng tôi một dấu hiệu', contactBody: 'Chia sẻ một chi tiết nhỏ để đội ngũ có thể xác nhận và sắp xếp thời gian trả lại phù hợp.', name: 'Tên của bạn', phone: 'Số điện thoại', email: 'Email', contactRequirement: 'Vui lòng điền số điện thoại hoặc email để Oria Spa liên hệ với bạn.', detail: 'Mô tả thêm để nhận diện', send: 'Gửi lời nhắn', close: 'Đóng', sent: 'Cảm ơn. Đội ngũ Oria sẽ liên hệ với bạn sớm.', privacy: 'Vì sự riêng tư, chúng tôi không hiển thị ảnh cận cảnh hay thông tin nhận diện của món đồ.', returned: 'Đã trả lại' },
  en: { eyebrow: 'Lost & Found', title: 'Your belonging is still waiting for you.', intro: 'Items found at Oria are kept with care for a short time. If something feels familiar, leave a note so our team can prepare a thoughtful return.', available: 'Held with care', contacting: 'In contact', found: 'Found at', contact: 'Contact Oria Spa', contactTitle: 'Give us a small sign', contactBody: 'Share one helpful detail so our team can confirm the item and arrange a comfortable return.', name: 'Your name', phone: 'Phone number', email: 'Email', contactRequirement: 'Please provide a phone number or email so Oria Spa can contact you.', detail: 'One detail that helps identify it', send: 'Send a note', close: 'Close', sent: 'Thank you. The Oria team will be in touch soon.', privacy: 'For privacy, we do not show close-up images or identifying details of found belongings.', returned: 'Returned' },
  jp: { eyebrow: '遺失物お預かり', title: 'お忘れ物は、まだお待ちしています。', intro: 'Oriaで見つかったお持ち物は、短期間大切に保管しています。心当たりがある場合は、チームが返却の準備をできるようメッセージをお送りください。', available: 'お預かり中', contacting: 'ご連絡中', found: '発見場所', contact: 'Oria Spaに連絡する', contactTitle: '確認のための手がかりを', contactBody: '確認と返却日時の調整のため、お持ち物の特徴をひとつお知らせください。', name: 'お名前', phone: '電話番号', email: 'メールアドレス', contactRequirement: 'Oria Spaからご連絡できるよう、電話番号またはメールアドレスをご入力ください。', detail: '確認に役立つ特徴', send: 'メッセージを送る', close: '閉じる', sent: 'ありがとうございます。Oriaチームよりまもなくご連絡します。', privacy: 'プライバシー保護のため、お持ち物の接写や識別情報は掲載していません。', returned: '返却済み' },
  kr: { eyebrow: '분실물 안내', title: '고객님의 물건이 아직 기다리고 있습니다.', intro: 'Oria에서 발견된 물건은 일정 기간 정성껏 보관합니다. 기억나는 물건이 있다면 팀이 반환을 준비할 수 있도록 메시지를 남겨 주세요.', available: '보관 중', contacting: '연락 중', found: '발견 장소', contact: 'Oria Spa에 문의하기', contactTitle: '작은 단서를 알려주세요', contactBody: '물건을 확인하고 편안한 반환 일정을 준비할 수 있도록 한 가지 특징을 알려주세요.', name: '성함', phone: '전화번호', email: '이메일', contactRequirement: 'Oria Spa에서 연락드릴 수 있도록 전화번호 또는 이메일을 입력해 주세요.', detail: '물건을 확인할 수 있는 특징', send: '메시지 보내기', close: '닫기', sent: '감사합니다. Oria 팀이 곧 연락드리겠습니다.', privacy: '개인정보 보호를 위해 분실물의 근접 사진이나 식별 정보는 공개하지 않습니다.', returned: '반환 완료' },
  cn: { eyebrow: '失物招领', title: '您的物品仍在等您。', intro: '在Oria找到的物品会被细心保管一段时间。如果您觉得某件物品属于您，请留言让团队为您安排归还。', available: '妥善保管中', contacting: '正在联系', found: '发现地点', contact: '联系 Oria Spa', contactTitle: '请提供一个小线索', contactBody: '请分享一项有助于确认物品的细节，方便团队为您安排归还。', name: '您的姓名', phone: '电话号码', email: '电子邮箱', contactRequirement: '请填写电话号码或电子邮箱，以便 Oria Spa 与您联系。', detail: '有助于识别物品的一项细节', send: '发送留言', close: '关闭', sent: '谢谢。Oria 团队将尽快与您联系。', privacy: '为保护隐私，我们不会展示物品特写或可识别的信息。', returned: '已归还' },
};

type LostAndFoundLocale = keyof typeof COPY;

const iconFor = (type: LostAndFoundItem['type']) => ({ glasses: Glasses, accessory: Sparkles, tech: Watch, other: Ear }[type]);
const toLocaleDate = (date: string, locale: string) => new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));

export default function LostAndFoundPage() {
  const { currentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const locale: LostAndFoundLocale = currentLang === 'en' || currentLang === 'jp' || currentLang === 'kr' || currentLang === 'cn' ? currentLang : 'vi';
  const copy = COPY[locale];
  const config = useMemo(() => normalizeLostAndFound(systemSettings?.lost_and_found), [systemSettings?.lost_and_found]);
  const [selected, setSelected] = useState<LostAndFoundItem | null>(null);
  const [sent, setSent] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get('phone') || '').trim();
    const email = String(formData.get('email') || '').trim();
    if (!phone && !email) {
      setContactError(copy.contactRequirement);
      return;
    }
    setContactError('');
    setSent(true);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Image src="/images/lost-and-found/lost-and-found-still-life.png" alt="Carefully held personal belongings" fill priority sizes="100vw" className={styles.heroImage} />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
      </section>

      <section className={styles.notice}>
        <ScanLine size={18} strokeWidth={1.4} />
        <p>{copy.privacy}</p>
      </section>

      <section className={styles.list} aria-label={copy.eyebrow}>
        {config.items.filter(item => item.status !== 'returned').map((item, index) => {
          const Icon = iconFor(item.type);
          const state = item.status === 'contacting' ? copy.contacting : copy.available;
          return (
            <article className={styles.item} key={item.id}>
              <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.itemVisual}>
                <Image src={item.image || '/images/lost-and-found/lost-and-found-still-life.png'} alt="" fill sizes="(max-width: 780px) 48px, 84px" className={styles.itemImage} />
                <span className={styles.symbol}><Icon size={18} strokeWidth={1.5} /></span>
              </div>
              <div className={styles.itemCopy}>
                <span className={styles.status}>{state}</span>
                <h2>{getLostAndFoundText(item.title, currentLang)}</h2>
                <p>{getLostAndFoundText(item.detail, currentLang)}</p>
              </div>
              <div className={styles.itemMeta}>
                <span><MapPin size={14} /> {copy.found}</span>
                <strong>{getLostAndFoundText(item.foundAt, currentLang)}</strong>
                <small>{toLocaleDate(item.foundOn, currentLang)}</small>
              </div>
              <button className={styles.contactTrigger} onClick={() => { setSelected(item); setSent(false); setContactError(''); }}>
                <span>{copy.contact}</span><ArrowUpRight size={17} />
              </button>
            </article>
          );
        })}
      </section>

      {selected && (
        <div className={styles.sheetBackdrop} role="presentation" onMouseDown={() => setSelected(null)}>
          <section className={styles.contactSheet} role="dialog" aria-modal="true" aria-labelledby="lost-found-contact-title" onMouseDown={event => event.stopPropagation()}>
            {sent ? (
              <div className={styles.confirmation}><Sparkles size={26} /><h2>{copy.sent}</h2><button onClick={() => setSelected(null)}>{copy.close}</button></div>
            ) : (
              <form onSubmit={handleSend}>
                <span className={styles.eyebrow}>{getLostAndFoundText(selected.title, currentLang)}</span>
                <h2 id="lost-found-contact-title">{copy.contactTitle}</h2>
                <p>{copy.contactBody}</p>
                <label>{copy.name}<input required name="name" autoComplete="name" /></label>
                <label>{copy.phone}<input name="phone" type="tel" autoComplete="tel" inputMode="tel" /></label>
                <label>{copy.email}<input name="email" type="email" autoComplete="email" inputMode="email" /></label>
                <p className={styles.contactRequirement}>{copy.contactRequirement}</p>
                {contactError && <p className={styles.contactError} role="alert">{contactError}</p>}
                <label>{copy.detail}<textarea required name="detail" rows={3} /></label>
                <div className={styles.sheetActions}><button type="button" onClick={() => setSelected(null)}>{copy.close}</button><button type="submit">{copy.send} <ArrowUpRight size={16} /></button></div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

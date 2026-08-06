'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import styles from './admissions.module.css';

const positions = [
  {
    id: 'technician',
    value: 'Kỹ thuật viên Spa',
    title: 'Kỹ thuật viên Spa',
    note: 'Toàn thời gian · Công việc thực hành dịch vụ',
  },
  {
    id: 'assistant',
    value: 'Học viện Assistant',
    title: 'Học viện Assistant',
    note: 'Hành chính · Hỗ trợ học viên',
  },
  {
    id: 'trainer',
    value: 'Giảng viên / Đào tạo viên',
    title: 'Giảng viên / Đào tạo viên',
    note: 'Giảng dạy · Đánh giá tay nghề',
  },
];

type ApplicationMode = 'recruitment' | 'admission';

export default function AdmissionFormClient() {
  const [applicationMode, setApplicationMode] = useState<ApplicationMode>('recruitment');
  const [photoPreview, setPhotoPreview] = useState('');
  const [certificatePreview, setCertificatePreview] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const updateSubmitState = (form: HTMLFormElement | null) => {
    if (!form) return;
    window.requestAnimationFrame(() => setCanSubmit(form.checkValidity()));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    updateSubmitState(event.target.form);

    if (!file) {
      setPhotoPreview('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      window.alert('Vui lòng chọn tệp hình ảnh hợp lệ.');
      event.target.value = '';
      setPhotoPreview('');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert('Ảnh phải có dung lượng nhỏ hơn 5 MB.');
      event.target.value = '';
      setPhotoPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setPhotoPreview(String(readerEvent.target?.result || ''));
      updateSubmitState(event.target.form);
    };
    reader.readAsDataURL(file);
  };

  const handleCertificateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    updateSubmitState(event.target.form);

    if (!file) {
      setCertificatePreview('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      window.alert('Vui lòng chọn tệp hình ảnh hợp lệ.');
      event.target.value = '';
      setCertificatePreview('');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert('Ảnh phải có dung lượng nhỏ hơn 5 MB.');
      event.target.value = '';
      setCertificatePreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setCertificatePreview(String(readerEvent.target?.result || ''));
      updateSubmitState(event.target.form);
    };
    reader.readAsDataURL(file);
  };

  const handleFormActivity = (event: FormEvent<HTMLFormElement>) => {
    updateSubmitState(event.currentTarget);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      setCanSubmit(false);
      return;
    }

    const data = new FormData(form);
    const fullName = String(data.get('fullName') || '').trim() || 'ứng viên';
    setStatusMessage(
      `Cảm ơn ${fullName}. Đơn ứng tuyển của bạn đã được ghi nhận trong bản mẫu. Hãy kết nối biểu mẫu với cơ sở dữ liệu, dịch vụ email hoặc hệ thống nhân sự để sử dụng thực tế.`,
    );
  };

  const isWorking = employmentStatus === 'working';

  return (
    <main className={styles.page}>
      <div className={styles.noise} aria-hidden="true" />
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>GIA NHẬP ĐỘI NGŨ ORIA</p>
          <h1>{applicationMode === 'recruitment' ? 'MÔI TRƯỜNG LÀM VIỆC ĐÁNG MƠ ƯỚC' : 'Admission'}</h1>
          {applicationMode !== 'recruitment' && (
            <p className={styles.heroCopy}>
              The admission application for Oria Spa Academy courses is being prepared. You can switch back to recruitment now, or return soon when the admission form opens.
            </p>
          )}

          <div className={styles.modeSwitch} aria-label="Choose application type">
            <button
              className={`${styles.modeButton} ${applicationMode === 'recruitment' ? styles.modeButtonActive : ''}`}
              type="button"
              onClick={() => setApplicationMode('recruitment')}
            >
              Recruitment
            </button>
            <button
              className={`${styles.modeButton} ${applicationMode === 'admission' ? styles.modeButtonActive : ''}`}
              type="button"
              onClick={() => setApplicationMode('admission')}
            >
              Admission
              <span>Coming soon</span>
            </button>
          </div>
        </div>

        <aside className={styles.heroNote}>
          <strong>Quy trình tuyển dụng</strong>
          {applicationMode === 'recruitment'
            ? 'Gửi thông tin cá nhân, chọn vị trí ứng tuyển và tải lên ảnh chân dung rõ nét. Ứng viên phù hợp sẽ được liên hệ để phỏng vấn hoặc kiểm tra tay nghề.'
            : 'Admission form sẽ được mở sau. Hiện tại trang này ưu tiên nhận hồ sơ Recruitment cho Oria Spa Academy.'}
        </aside>
      </section>

      <section className={styles.formSection} id="application">
        <div className={styles.formShell}>
          <div className={styles.formHeader}>
            <div>
              <p className={styles.eyebrow}>Oria Spa Academy</p>
              <h2>{applicationMode === 'recruitment' ? 'Đơn Ứng Tuyển' : 'Admission Coming Soon'}</h2>
            </div>
            <div className={styles.stepIndicator}>
              {applicationMode === 'recruitment' ? '01 / Thông tin ứng viên' : '02 / Sắp ra mắt'}
            </div>
          </div>

          {applicationMode === 'recruitment' ? (
            <form
              className={styles.form}
              onChange={handleFormActivity}
              onInput={handleFormActivity}
              onSubmit={handleSubmit}
            >
            <aside className={styles.profilePanel}>
              <h3>Ảnh hồ sơ</h3>

              <label className={styles.uploadBox} htmlFor="photo">
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  required
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <img
                    className={styles.preview}
                    src={photoPreview}
                    alt="Xem trước ảnh ứng viên"
                  />
                ) : (
                  <div className={styles.uploadContent}>
                    <div className={styles.uploadIcon}>+</div>
                    <strong>Tải ảnh toàn thân của bạn</strong>
                    <div style={{ marginBottom: 12 }}>
                      <span className={styles.requiredBadge}>BẮT BUỘC</span>
                    </div>
                    <span>
                      JPG hoặc PNG · Tối đa 5 MB
                      <br />
                      Ảnh rõ toàn thân, nền đơn giản
                    </span>
                  </div>
                )}
              </label>

              <p className={styles.photoCaption}>
                Ảnh toàn thân chỉ được sử dụng để xác minh ứng viên và phục vụ quy trình
                tuyển dụng.
              </p>

              <label className={`${styles.uploadBox} ${styles.certificateUploadBox}`} htmlFor="certificatePhoto">
                <input
                  id="certificatePhoto"
                  name="certificatePhoto"
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleCertificateChange}
                />
                {certificatePreview ? (
                  <img
                    className={styles.preview}
                    src={certificatePreview}
                    alt="Xem trước ảnh chứng chỉ"
                  />
                ) : (
                  <div className={styles.uploadContent}>
                    <div className={styles.uploadIcon}>+</div>
                    <strong>Thêm ảnh chứng chỉ</strong>
                    <div style={{ marginBottom: 12 }}>
                      <span className={styles.requiredBadge}>BẮT BUỘC</span>
                    </div>
                    <span>
                      JPG hoặc PNG
                      <br />
                      Tối đa 5 MB
                    </span>
                  </div>
                )}
              </label>
            </aside>

            <div className={styles.detailsPanel}>
              <h3>Thông tin ứng viên</h3>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="fullName">
                    Họ và tên <span>Bắt buộc</span>
                  </label>
                  <input id="fullName" name="fullName" type="text" placeholder="Họ tên đầy đủ" required />
                </div>

                <div className={styles.field}>
                  <label htmlFor="dob">
                    Ngày sinh <span>Bắt buộc</span>
                  </label>
                  <input id="dob" name="dob" type="date" required />
                </div>

                <div className={styles.field}>
                  <label htmlFor="phone">
                    Số điện thoại <span>Bắt buộc</span>
                  </label>
                  <input id="phone" name="phone" type="tel" placeholder="+84 ..." required />
                </div>

                <div className={styles.field}>
                  <label htmlFor="email">
                    Địa chỉ email
                  </label>
                  <input id="email" name="email" type="email" placeholder="ten@email.com" />
                </div>

                <div className={styles.field}>
                  <label htmlFor="address">
                    Địa chỉ nơi ở hiện tại <span>Bắt buộc</span>
                  </label>
                  <input id="address" name="address" type="text" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" required />
                </div>

                <div className={styles.field}>
                  <label htmlFor="languages">
                    Ngôn ngữ giao tiếp
                  </label>
                  <input
                    id="languages"
                    name="languages"
                    type="text"
                    placeholder="Ví dụ: Tiếng Việt, Tiếng Anh, Tiếng Trung..."
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="height">
                    Chiều cao (cm)
                  </label>
                  <input id="height" name="height" type="number" min="120" max="230" step="1" placeholder="Ví dụ: 165" />
                </div>

                <div className={styles.field}>
                  <label htmlFor="weight">
                    Cân nặng (kg)
                  </label>
                  <input id="weight" name="weight" type="number" min="30" max="250" step="0.1" placeholder="Ví dụ: 55" />
                </div>

                <div className={styles.field}>
                  <label htmlFor="experience">
                    Những công việc đã từng làm <span>Bắt buộc</span>
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="text"
                    placeholder="Ví dụ: Lễ tân, kỹ thuật viên spa, nhân viên quán ăn..."
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="employmentStatus">
                    Tình trạng công việc hiện tại <span>Bắt buộc</span>
                  </label>
                  <select
                    id="employmentStatus"
                    name="employmentStatus"
                    value={employmentStatus}
                    onChange={(event) => {
                      setEmploymentStatus(event.target.value);
                      updateSubmitState(event.target.form);
                    }}
                    required
                  >
                    <option value="">Chọn tình trạng</option>
                    <option value="working">Đang đi làm</option>
                    <option value="not-working">Hiện chưa đi làm</option>
                    <option value="student">Học viên / Thực tập sinh</option>
                    <option value="freelance">Làm việc tự do</option>
                  </select>
                </div>

                {isWorking ? (
                  <div className={`${styles.field} ${styles.full}`}>
                    <label htmlFor="jobChangeReason">
                      Lý do bạn muốn thay đổi công việc hiện tại? <span>Bắt buộc</span>
                    </label>
                    <textarea
                      id="jobChangeReason"
                      name="jobChangeReason"
                      placeholder="Vui lòng chia sẻ ngắn gọn lý do bạn đang cân nhắc thay đổi công việc."
                      required
                    />
                  </div>
                ) : null}

                <div className={`${styles.field} ${styles.full} ${styles.sectionTitle}`}>
                  <div className={styles.sectionLabel}>
                    Công việc gần đây nhất
                    <span>Bắt buộc trả lời đầy đủ</span>
                  </div>
                  <p>
                    Vui lòng cung cấp thông tin về công việc gần đây nhất để bộ phận tuyển
                    dụng có thể đánh giá phù hợp.
                  </p>
                </div>

                <div className={styles.field}>
                  <label htmlFor="previousCompany">
                    Nơi bạn đã từng làm việc <span>Bắt buộc</span>
                  </label>
                  <input
                    id="previousCompany"
                    name="previousCompany"
                    type="text"
                    placeholder="Tên spa, công ty hoặc cơ sở làm việc"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="previousPosition">
                    Vị trí đã đảm nhiệm <span>Bắt buộc</span>
                  </label>
                  <input
                    id="previousPosition"
                    name="previousPosition"
                    type="text"
                    placeholder="Ví dụ: Kỹ thuật viên spa, lễ tân..."
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="previousDuration">
                    Thời gian đã gắn bó <span>Bắt buộc</span>
                  </label>
                  <input id="previousDuration" name="previousDuration" type="text" placeholder="Ví dụ: 06/2024 - 07/2026" required />
                </div>

                <div className={styles.field}>
                  <label htmlFor="previousReason">
                    Lý do nghỉ việc <span>Bắt buộc</span>
                  </label>
                  <input id="previousReason" name="previousReason" type="text" placeholder="Vui lòng ghi ngắn gọn và trung thực" required />
                </div>

                <div className={`${styles.field} ${styles.full}`}>
                  <label htmlFor="previousDuties">
                    Kỹ năng chuyên môn, ưu điểm <span>Bắt buộc</span>
                  </label>
                  <textarea
                    id="previousDuties"
                    name="previousDuties"
                    placeholder="Mô tả kỹ năng, dịch vụ, kỹ thuật, ưu điểm hoặc thế mạnh chuyên môn của bạn."
                    required
                  />
                </div>
              </div>

              <h3>Vị trí ứng tuyển</h3>

              <div className={styles.courseGrid} role="radiogroup" aria-label="Chọn vị trí ứng tuyển">
                {positions.map((position) => (
                  <label className={styles.course} key={position.id} htmlFor={position.id}>
                    <input
                      id={position.id}
                      type="radio"
                      name="course"
                      value={position.value}
                      required={position.id === 'technician'}
                    />
                    <span>{position.title}</span>
                    <small>{position.note}</small>
                  </label>
                ))}
              </div>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="startDate">Thời gian có thể bắt đầu</label>
                  <select id="startDate" name="startDate" required defaultValue="">
                    <option value="">Chọn thời gian</option>
                    <option>Có thể bắt đầu ngay</option>
                    <option>Trong vòng 2 tuần</option>
                    <option>Trong vòng 1 tháng</option>
                    <option>Linh hoạt / Trao đổi khi phỏng vấn</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="contactMethod">Hình thức liên hệ mong muốn</label>
                  <select id="contactMethod" name="contactMethod" required defaultValue="">
                    <option value="">Chọn hình thức</option>
                    <option>Gọi điện</option>
                    <option>Email</option>
                    <option>Zalo</option>
                    <option>WhatsApp</option>
                  </select>
                </div>

                <div className={`${styles.field} ${styles.full}`}>
                  <label htmlFor="referralSource">
                    Bạn biết Oria qua hình thức, phương tiện nào? <span>Bắt buộc</span>
                  </label>
                  <textarea
                    id="referralSource"
                    name="referralSource"
                    placeholder="Ví dụ: website, Facebook, TikTok, bạn bè giới thiệu, cơ sở thực tế..."
                    required
                  />
                </div>

                <div className={`${styles.field} ${styles.full}`}>
                  <label htmlFor="message">
                    Tại sao bạn muốn ứng tuyển vào Oria Spa? <span>Bắt buộc</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Vui lòng chia sẻ lý do bạn quan tâm đến vị trí này và mong muốn làm việc tại Oria Spa."
                    required
                  />
                </div>
              </div>

              <label className={styles.consent}>
                <input type="checkbox" required />
                <span>
                  Tôi xác nhận rằng các thông tin đã cung cấp là chính xác và đồng ý để
                  Oria Spa Academy liên hệ về quy trình tuyển dụng và sắp xếp phỏng vấn.
                </span>
              </label>

              {statusMessage ? (
                <div className={styles.status} role="status" aria-live="polite">
                  {statusMessage}
                </div>
              ) : null}

              <div className={styles.formActions}>
                <button className={styles.submit} type="submit" disabled={!canSubmit}>
                  Gửi đơn ứng tuyển
                </button>
              </div>
            </div>
            </form>
          ) : (
            <div className={styles.comingSoonPanel}>
              <p className={styles.eyebrow}>Admission</p>
              <h3>Form admission đang được chuẩn bị</h3>
              <p>
                Phần Admission sẽ dành cho học viên đăng ký khóa học, lịch khai giảng,
                tư vấn lộ trình và thông tin nhập học. Hiện tại Oria Spa Academy đang ưu
                tiên nhận hồ sơ tuyển dụng qua form Recruitment.
              </p>
              <button
                className={styles.secondaryAction}
                type="button"
                onClick={() => setApplicationMode('recruitment')}
              >
                Quay lại Recruitment
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

# Go-live: tach cap so don, giu nguyen schema nghiep vu

Final execution and acceptance plan: `GO_LIVE_FINAL_EXECUTION_AND_ACCEPTANCE_20260909.md`. Follow that file when earlier next-step instructions conflict. External audit establishes source-level compatibility, not completed live acceptance.

Ngay ra soat: 2026-09-09. Trang thai: IMPLEMENTED LOCALLY, CHUA APPLY DB DUNG CHUNG.

## 1. Pham vi da chot

- Chi them mot bang cap so: `public."WebbookingBookingDailyCounters"`.
- Khong ALTER `Bookings`, `BookingItems`, `Customers`; khong them index, FK, enum, trigger, policy vao cac bang nay.
- Khong tao bang quan ly status, khong them PENDING vao Bookings.
- Admin website chi CMS/media. Admin noi bo tiep tuc nhan va dieu phoi don.
- Website van duoc INSERT don/dich vu moi theo hop dong hien huu. Khong doi schema KHONG co nghia la khong ghi don.
- Khong sua gia, duration, service status hay du lieu khach hang that de test.
- Khong chay hai SQL cu: `supabase/migrations/20260907_p0_atomic_booking_idempotency.sql` va `supabase/GO_LIVE_BOOKING_SCHEMA_READY_TO_PASTE.sql`.

## 2. Ket qua kiem tra lai

Da doc README, DEVELOPMENT_NOTES, API booking va SQL hien tai. Da GET metadata Supabase `/rest/v1/` bang cau hinh local, HTTP 200; khong goi RPC ghi, khong tao/sua/xoa don.

| Hang muc | Bang chung hien tai |
| --- | --- |
| Bookings | PK `id` text; `billCode` text; chua expose `idempotency_key`/`idempotency_fingerprint` |
| BookingItems | PK `id` text; FK `bookingId` -> Bookings.id; FK serviceId -> Services.id |
| Trang thai ban dau | Bookings default NEW; BookingItems default WAITING |
| Enum Bookings | NEW, IN_PROGRESS, DONE, CANCELLED, PREPARING, COMPLETED, FEEDBACK, CLEANING, SPLIT |
| Bang cap so | Khong co trong metadata duoc expose |
| create_booking_atomic | Khong co trong metadata RPC duoc expose |
| Nghiep vu dieu phoi | Metadata co dispatch_confirm_booking, split_booking_into_sub_bookings, undo_split_booking; khong goi/doi cac RPC nay |
| Thoi gian | Bookings.bookingDate la timestamp WITHOUT time zone; phai kiem tra cach admin noi bo dien giai |
| Customer link | Bookings.customerId hien da co FK toi Customers.id |
| Du lieu bao ve | Bookings.accessToken co default; khong tu ghi de hay dua token vao bao cao |

Gioi han bang chung: OpenAPI khong thay the pg_catalog. Chua xac minh toan bo triggers, indexes, RLS, grants, publication/realtime, function khong expose va source cua admin noi bo. Phai co snapshot metadata SQL read-only va xac nhan nguoi van hanh truoc migration. Khong ket luan admin da nhan don dua tren DB metadata.

### Source can sua

- `src/app/api/bookings/route.ts`: replay chi doc `idLegacy = idemp:<key>`; khong con SELECT cot idempotency chua ton tai.
- `src/app/api/bookings/route.ts`: goi allocator chi de lay ID, sau do direct-insert Bookings/BookingItems theo contract cu; khong con phu thuoc create_booking_atomic hay webbooking_submit_booking.
- `src/app/api/bookings/route.ts:315`: email marker dang UPDATE reception_feedback; can tach khoi cot nghiep vu, khong xoa gia tri da co.
- SQL cu them cot/index Bookings, index Customers, FK va logic tao Customers; vuot pham vi counter-only.
- SQL cu da revoke anon/authenticated va chi grant service_role. Khong lap lai ket luan lich su rang file hien tai van grant browser roles.
- Ca browser local truoc do: reprice 200, submit 503; 9 ca con lai chua chay. Xem `LOCAL_CUSTOMER_FLOW_ACCEPTANCE_20260909.md`.

## 3. Kien truc de xuat va diem phai chot

Tach ba trach nhiem: cap ma duy nhat; ghi nguyen ven don va items; replay cung request khong tao don thu hai.

### A. Bang va ham cap so

- Bang: date_key DATE PRIMARY KEY, last_seq BIGINT NOT NULL, updated_at TIMESTAMPTZ; CHECK last_seq >= 0. Chi bang nay nhan DDL/index/policy moi.
- Ham du kien `webbooking_allocate_booking_number`: UPSERT tang last_seq va RETURNING trong DB; khong dung MAX+1 tren frontend, khong lock trong memory Node.
- Counter date do server suy ra theo Asia/Ho_Chi_Minh. Chot ngay dat hay ngay hen theo ma admin dang dung; khong tu lay ngay UTC hoac ngay tu browser.
- Dinh dang `WB-DDMMYYYY-NNN` la contract cap so dang de xuat. Xac minh ID/billCode cu va bo loc/regex admin truoc khi chot; khong tu coi counter moi la contract cua he thong dieu phoi.
- Khong truncate so khi vuot 999. Cho phep khoang trong sequence; khong tai su dung so da cap, khong ha counter khi rollback release.
- Preflight doc ma hien huu, kiem tra namespace cac writer khac va khoi tao counter phu hop. PK Bookings.id la hang rao cuoi, nhung khong du de bao ve billCode neu billCode khong unique.
- Neu admin noi bo cung phat ma cung namespace, phai chot namespace rieng hoac allocator chung truoc; KHONG sua admin noi bo trong task nay.
- Counter private: RLS, revoke PUBLIC/anon/authenticated. Ham chi backend service_role, search_path co dinh, input duoc validate. Khong cap quyen cho browser.

### B. Ghi don nguyen ven, khong doi schema

- Khong thay mot RPC bang hai REST INSERT roi xoa bu tru. Admin co the thay parent chua co items va rollback bu tru co the that bai.
- Giu nguyen direct-insert entrypoint hien tai cua web: server doc Services, resolve/link Customers theo contract cu, goi allocator de lay ID, sau do INSERT Bookings va BookingItems voi cac field hien huu. Khong tao writer moi, khong dung `dispatch_confirm_booking` de tao don.
- Allocator khong phai transaction wrapper. Neu contract hien huu khong atomic, chi giu co che rollback da co va ghi ro residual risk; khong duoc am tham thay bang mot RPC tao don moi.
- Ham tao don khong update don cu, khong dieu phoi technician/bed, khong doi status sau khoi tao. Default NEW/WAITING duoc giu, khong reset status khi replay.
- Gia lay tu Services, khong tin price/status do browser truyen; giu signed quote va kiem tra catalog tai commit. Khong UPDATE Services.
- Customer resolve/link, source, branchName, customerLang, room/preferences, timezone va options phai khop contract admin. Khong tu tao/merge Customers hay ghi null customerId neu admin bat buoc lien ket; chot theo luong da xac minh.
- Tat ca item thuoc dung bookingId; so luong/duration/options/add-on giu nguyen, selected service khong bi gom mat cac lua chon.

### C. Replay/idempotency: release gate rieng

- Mot daily counter KHONG luu duoc moi quan he request -> booking, fingerprint hay tinh trang email.
- Khong tu them cot vao Bookings, khong dung notes/reception_feedback lam kho idempotency, khong dung Map trong memory lam bao dam production.
- Preflight xac minh `idLegacy` co that su duoc danh rieng cho web request hay dang dung boi he thong khac; khong chi dua vao ten cot de ket luan.
- Neu da co durable request store/entrypoint trong he thong dieu phoi: tai su dung no, lock request theo transaction; same key/same intent tra don cu, same key/different intent tra 409. Replay khong ghi de status/ghi chu don cu.
- Trong repo hien tai chi co marker `idLegacy = idemp:<key>` va replay lookup; khong co bang/unique index/fingerprint da duoc xac minh. Vi vay chi duoc claim replay tuan tu; concurrent same-key phai la BLOCKED cho den khi chu he thong xac nhan contract.
- Khong them unique index vao Bookings, khong doi `idLegacy`, khong dung counter lam request store. Khong bo idempotency de het 503.
- Thay fallback hash toan bo noi dung bang request identity on dinh qua retry; don moi hop le co request identity moi, tranh chan hai lan dat giong nhau co chu dich.

### D. Email khong dung cot dieu phoi

- Bo UPDATE reception_feedback cho email marker, khong xoa/chuyen du lieu cu tu dong.
- Gui confirmation sau commit, dung snapshot da luu. Mail fail khong rollback booking thanh cong.
- Kiem tra delivery/retry hien huu cua mail provider; chi chot retry ben vung neu co durable store/queue da duoc chap nhan. Khong hua exactly-once voi SMTP khi chua co co che.
- UI phan biet booked/email pending; retry mail khong tao booking moi. Pending khong duoc tinh PASS email acceptance.
- Khong gui mail bao cao QA thay cho mail xac nhan booking.

## 4. Phase va phan cong

### Round dang thuc hien 2026-09-09

- Luna-1 / Herschel (`01a08511-b3a0-7d10-a8fa-fc938e2f6856`): read-only contract audit; DONE, ket luan repo co ba the he booking contract.
- Luna-2 / Meitner (`01a08512-059c-72f0-a88e-32b2fa8a67a2`): SQL counter-only; DONE, da bo writer va khong chay remote SQL.
- Luna-3 / Kuhn (`01a08512-0604-76a1-9435-ed888b9108ad`): isolated test harness; STATIC DONE 8/8, disposable PostgreSQL BLOCKED by local `shmget` permission and was stopped.
- Luna-4 / Laplace (`01a08512-065d-79e2-b2ac-5c262047f709`): API/acceptance audit; DONE, NO-GO cho den khi xac minh shared-DB/admin/mail.

Integrator chinh: giu source route va merge cac ket qua theo dung write-scope. Khong cho phep bốn agent cung sua `route.ts`/schema booking.

### Phase 0 - Chot hop dong, chi doc (bat buoc truoc code DB)

- Agent A: xuat metadata columns/defaults/constraints/indexes/triggers/RLS/grants/publications va signature functions lien quan; khong doc/xuat PII khach that.
- Agent B: audit route, payload, timezone, replay/email, tim duong ghi don dang duoc su dung; lap contract mapping voi admin noi bo.
- Agent C: lap fixtures gia/catalog isolated va test negative/concurrency.
- Agent D: chuan bi browser cases, checklist inbox va xac nhan admin noi bo; chua submit.
- Exit: chot ID format/date/namespace, replay ownership, customer link, email retry va phuong an parent/child receiving timing. Contract nay khong tu dong them booking writer atomic moi.

### Phase 1 - Implement tren fixture/isolated DB

- A so huu SQL moi va SQL read-only verification; khong sua SQL cu thanh file de nguoi dung vo tinh apply.
- B so huu API booking/service adapter/email path; bo dependency cot chua ton tai va RPC cu, giu response contract frontend.
- C so huu unit/integration fixtures, khong sua API/SQL cua A/B.
- D so huu browser scripts/checklist/report, khong sua implementation.
- A/B thong nhat input/output RPC truoc; C/D co the chay song song tren contract. Integrator merge va chay regression sau, khong 4 agent cung edit route.ts.
- Deliverables: SQL moi ready-to-paste counter-only DDL + functions da duyet, preflight/postflight SQL, source diff, automated tests. PLAN nay khong phai SQL de paste.

### Phase 2 - Gate ky thuat tren DB disposable

- 50 request khac nhau dong thoi -> 50 ma rieng, moi don du items, tong dung gia fixture.
- Replay tuan tu cung `idLegacy` tra don cu; concurrent same-key chi PASS khi chu he thong dieu phoi xac nhan co lock/storage ben ngoai. Neu khong, ghi BLOCKED, khong tao load test tren DB dung chung.
- Loi item thu hai -> verify rollback cleanup khong de parent orphan; neu cleanup that bai thi BLOCKED va khong go-live. Reconnect/timeout sau commit -> replay ve don cu.
- Counter qua 999, giao ngay VN/UTC, ma hien huu collision; khong duplicate id/billCode.
- anon/authenticated khong goi duoc allocator; SQL khong co writer moi. Payload price/status tamper khong duoc chap nhan boi route hien huu.
- Gio 22:30 la gio nhan lich cuoi theo yeu cau; 22:31/ngoai slot/past bi chan. Gio mo cua phai doi chieu config, khong tu gia dinh.
- Quote het han/catalog doi, quantity 0/am/le/qua gioi han, service inactive, options khong hop le: reject truoc ghi.
- Mail timeout/fail/retry, server restart, request retry sau status da thay doi: khong tao don trung/ghi de dieu phoi.
- Snapshot schema Bookings/BookingItems/Customers truoc-sau y het, ke ca index/trigger/RLS. So sanh catalog digest truoc-sau, khong thay doi gia that.
- Chay typecheck, build, cac booking regression tests da co sau khi cap nhat mock theo contract moi. Ket qua mock khong thay the E2E.

### Phase 3 - Ap dung co kiem soat

- Review SQL diff, duyet functions ghi don va contract admin, snapshot DB metadata truoc khi paste.
- Ap SQL moi truoc, verify ham/quyen/counter; khong goi allocator chi de health-check vi se tieu hao so.
- Khoi dong local bang build dir rieng, dung DB da duyet; dat 1 don canary QA. Xac nhan admin nhan dung va mail toi inbox roi moi chay 9 ca con lai.
- Khong chay destructive fixtures/load-test tren shared production DB. Khong tu huy/xoa don QA sau test; gui danh sach ma cho van hanh xu ly theo quy trinh.

## 5. Muoi ca browser E2E that

Nhan dien QA trong ten/ghi chu; email `nghik22@gmail.com`, phone Vietnam +84 `389898593`. Chon ngay gio tuong lai hop le duoc van hanh dong y. Gia/ngon ngu/doc catalog truc tiep tu DB, khong hardcode tien vao assertion production.

| Ca | Ngon ngu / thao tac |
| --- | --- |
| 01 | EN: VIP Combo King x1, 120 phut neu catalog con cung cap, medium/random |
| 02 | VI: mot body service, duration ngan, x1 |
| 03 | JP: tang cung option len x2; kiem tra moi service da chon hien dung |
| 04 | KR: cung service, Add another option voi duration khac |
| 05 | ZH: body + private-room add-on neu catalog cho phep |
| 06 | VI: foot care + strength/focus/avoid duoc ho tro |
| 07 | EN: ear clean, quay lai sua option truoc confirm |
| 08 | JP: barber + foot, giam/xoa mot lua chon roi them lai |
| 09 | KR: premium, chon therapist neu catalog cho phep; khong tu gan dieu phoi |
| 10 | ZH: nhieu service/duration; double submit/retry cung request, chi mot don |

Neu service/option khong duoc catalog ho tro, ghi BLOCKED hoac chot ca thay the, khong sua catalog that de tao dieu kien test.

Moi ca phai co: thao tac UI -> invoice/quote -> contact/date/time -> dong y dieu khoan QA -> submit -> ma don -> DB parent/items -> admin noi bo nhin thay -> mail confirmation thuc te. Ghi gia/so luong/options/gio va doi chieu o tat ca cac diem.

- Viewports: it nhat 3 ca mobile 390px, 2 tablet 768px, con lai desktop 1440px; kiem tra overflow/modal/cart badge.
- Mail: provider accepted KHONG bang inbox received. Ghi message ID/delivery event va bang chung inbox (neu khong co quyen mailbox thi nguoi dung xac nhan); khong tu danh PASS.
- Admin noi bo: nguoi van hanh xac nhan don hien trong dung hang doi, dung service/options/thoi gian va customer link. Metadata/row ton tai KHONG thay the buoc nay.
- Terms consent da duoc user cho phep voi don QA; khong thay doi payment requirement, khong thuc hien thanh toan.

## 6. Tieu chi go/no-go va rollback

- GO khi Phase 0 da chot, schema shared khong doi, tests transaction/replay/concurrency pass, 10/10 browser cases pass ca mail va admin receiving, khong con P0/P1.
- Bieu mau report: case, build/commit, environment, viewport/locale, steps, expected/actual, bookingId, DB evidence, admin evidence, mail evidence, PASS/FAIL/BLOCKED, issue reference.
- Neu khong xem duoc admin/mailbox: BLOCKED nghiem thu tich hop, khong bao go-live ready.
- Deploy chi sau duyet, branch `vercel`, xac minh production env (khong in secret). Local pass khong dong nghia live pass; can production smoke co kiem soat.
- Rollback code ve ban tuong thich da kiem chung; khong mac dinh quay ve ban hien tai dang loi 503. Neu khong co ban an toan, dung nhan submit moi voi thong bao ro rang.
- Giu counter/so da cap/don da tao; khong DROP hay reset sequence de rollback. Khong ALTER/xoa du lieu nghiep vu. Giu duong replay cho don da commit.

## 7. Trang thai hien tai

Da implement trong repo:

- `supabase/GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql`: chi tao counter table moi va mot allocator SECURITY DEFINER; khong ALTER schema ba bang nghiep vu, khong co booking writer.
- `supabase/verification/20260909_counter_only_preflight_read_only.sql`: preflight chi doc.
- `src/app/api/bookings/route.ts`: bo SELECT hai cot idempotency khong ton tai, giu `idLegacy = idemp:<key>`, goi allocator chi de lay ID, sau do giu direct insert Bookings/BookingItems va customer linkage hien huu; khong ghi `reception_feedback`.
- `src/components/BookingCheckout/BookingCheckout.tsx` va `src/components/BookingForm/BookingForm.logic.ts`: gui request key on dinh theo mot luong submit.
- `scripts/test-counter-only-booking-db.mjs`: counter-only static contract 10/10; disposable PostgreSQL remains unavailable locally because of `shmget` permission.

Da pass trong local: counter-only static contract 10/10, actual-route mocked integration 13/13, Terra-2 API matrix 14/14, `npx tsc --noEmit`, production `npm run build`, `git diff --check`, `npm run lint` exit 0. Disposable PostgreSQL khong chay duoc do local `shmget` permission; khong claim concurrency/privilege runtime PASS tu test nay.

Da doc metadata Supabase REST lai: counter table va allocator chua co; `webbooking_submit_booking`/`create_booking_atomic` khong duoc chon lam contract cua counter task; cac schema `Bookings`/`BookingItems` hien huu van duoc giu nguyen. Preflight SQL truc tiep khong ket noi duoc bang `DATABASE_URL`/`DIRECT_URL` vi credentials hien tai tra ve `28P01 password authentication failed for user postgres`; khong co ghi DB nao xay ra.

Chua apply SQL vao DB dung chung, chua tao don moi va chua claim admin/mail acceptance. Admin dispatch audit da xac nhan namespace va field contract, nhung con blocker parent/child timing. Buoc tiep theo la chot bien phap hydrate/wait o admin receiving, dung SQL Editor/credential DB dung de chay preflight, paste SQL counter-only neu preflight pass, sau do canary + 10 browser E2E. Khong paste hai migration lich su.

## 8. Round 2 execution 2026-09-09

- Agent 1 / API replay and unique handling: DONE. The route now distinguishes `idLegacy` conflicts from `Bookings.id`/`billCode` conflicts and unknown unique violations. An idempotency conflict re-reads the established marker, waits briefly for child rows, replays only a complete matching booking, returns retryable `BOOKING_IN_PROGRESS` when the parent has no items, and returns `IDEMPOTENCY_KEY_REUSED` for a different request identity or line/options intent. It never requests replacement counter numbers for an `idLegacy` conflict.
- Agent 2 / namespace and operations handoff: EXTERNAL AUDIT RECEIVED. Admin dispatch confirms `BK-11NDK-*`/`NNN-DDMMYYYY` for its own writer, accepts website `WB-DDMMYYYY-NNN`, receives `WEB_BOOKING` with `NEW`, preserves `customerId`/`idLegacy`, and does not require `id = billCode`. Namespace/concurrent-writer gate is PASS; parent/child Realtime timing remains FAIL because admin subscribes `Bookings` INSERT but not `BookingItems` INSERT.
- New verification coverage: actual-route mocked integration is now 13/13. Terra-2 API matrix remains 14/14. Counter-only static contract is 10/10 and includes `supabase/verification/20260909_counter_only_postflight_read_only.sql` for allocator signature and privilege checks.
- Remaining release gate: operations project must implement or explicitly accept a receiving-side mitigation for parent/child timing (wait-and-refetch/hydrate items, or an equivalent existing mechanism). Do not add `webbooking_submit_booking` under this contract. Until the receiving race is resolved and live preflight/postflight pass, do not claim full booking acceptance.

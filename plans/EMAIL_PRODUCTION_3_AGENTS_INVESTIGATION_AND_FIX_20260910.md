# Dieu tra va sua email booking production: 3 agent

Ngay: 2026-09-10. Trang thai: PLAN, chua ket luan root cause production.

## 1. Muc tieu va contract

- Xac dinh vi sao don vao admin dieu phoi nhung email tiep nhan yeu cau khong toi khach.
- Chung minh nguyen nhan bang cung mot booking ID, request va deployment; sua dung diem loi va nghiem thu tren production.
- Email website chi thong bao da tiep nhan yeu cau. Admin dieu phoi moi xac nhan lich hen.
- Don da commit va duoc xac minh thanh cong van la thanh cong khi mail loi. Khong yeu cau khach tao don moi de nhan lai mail.
- Neu chua xac minh duoc commit, giu gio hang va retry cung key; khong gui email dua tren ma vua cap.
- Giu nguyen schema, status, gia, customerId, idLegacy, trigger cua Bookings/BookingItems va he thong admin. Khong sua gia/dich vu/data don that de test.
- Khong tu them outbox/table/migration. Neu bang chung cho thay can retry ben vung, trinh thiet ke rieng va tac dong truoc khi ap dung.

## 2. Bang chung hien co va gioi han

| Thong tin | Nguon | Duoc ket luan |
| --- | --- | --- |
| Local gui mail duoc; Vercel project co SMTP env | Chu website xac nhan | Khong mac dinh ket luan thieu env |
| Admin nhan don; Zoho logs khong co message | Chu website xac nhan | Chua co bang chung Zoho da chap nhan message; can kiem tra dung account, thoi gian va request |
| Route await mail sau commit va verification | src/app/api/bookings/route.ts:606-639 | Co cua so don da luu nhung email chua gui |
| Replay/reconciliation tra snapshot truoc mailer | route.ts:332-349, 509-515, 611-615 | Co duong thanh cong khong goi mail; chua chung minh don gap loi di duong nay |
| Route catch rong; mailer catch cuoi chi ghi loi chung | route.ts:637; src/lib/mailer.ts:803-805 | Thieu du lieu de phan loai loi |
| Mailer tra success theo sendMail resolve, khong doi chieu accepted/rejected | mailer.ts:791-802 | Can kiem tra partial recipient rejection; messageId khong chung minh inbox receipt |
| Client abort request sau 20 giay | checkout/page.tsx:1169-1170 | Can test race voi SMTP; abort client khong tu chung minh server da dung |

Khong suy ra 'Zoho khong co log = route khong goi mail'. Loi DNS/TCP/TLS/auth hoac tao template truoc sendMail cung can bang chung. Khong suy ra 'khong thay Mailer log = khong goi mail' neu log retention/filter chua duoc kiem tra.

## 3. Cach chia viec song song

Integrator chot base SHA thuc te bang git, khong dung SHA cu trong hoi thoai lam deployment proof. Tao worktree rieng cho tung agent tu cung base. Giu nguyen file nguoi dung dang sua. Khong agent nao tu merge, push/deploy, chay migration hay resend hang loat.

| Agent | Pham vi so huu | San pham |
| --- | --- | --- |
| 1: Production evidence | Chi doc Vercel/Zoho/DB; plans/email-production-20260910/agent-1-evidence.md | Timeline production, diem cuoi da thanh cong va diem dau that bai |
| 2: Booking control flow | src/app/api/bookings/route.ts; scripts/test-go-live-api.mjs; scripts/test-booking-route-control-flow.mjs; plans/email-production-20260910/agent-2-flow.md | Bang nhanh API, regression reproducer, patch route co dieu kien |
| 3: Mail transport | src/lib/mailer.ts; scripts/test-mailer-hardening.ts; plans/email-production-20260910/agent-3-mailer.md | Ket qua tung buoc SMTP/template, patch mailer va test |

Agent 2/3 chi sua file so huu. Neu can sua checkout, package, diagnostic route hoac shared type thi ghi yeu cau de integrator lam sau; khong cung sua file. Hai agent co the dieu tra/test song song, nhung phai chot return contract mailer truoc khi tich hop patch.

## 4. Agent 1: Xac minh request production

1. Xac dinh URL da dat don, Vercel project, production alias, deployment ID, Git SHA, deployment time, runtime version/region. Doi chieu source handler tren SHA do voi local. Khong lay trang 200 hoac git push thanh cong lam bang chung deploy.
2. Chon mot don loi cu the bang booking ID va thoi gian submit. Cac ma WB-10092026-009/010 chi la ung vien lich su; khong mac dinh la don nguoi dung vua bao loi.
3. Chi doc dung don va items lien quan: source, status, customerEmail present/valid, customerId present, item count, idLegacy marker. Bao cao che email/phone; khong export data khach hang hang loat.
4. Lay Runtime Logs cua POST /api/bookings o dung khoang gio (ghi ca UTC va Asia/Ho_Chi_Minh), request ID, HTTP status, duration, timeout/termination, Mailer logs. Ghi ro neu log da het retention.
5. Lay response request neu con: success, idempotent, bookingId, emailStatus, messageId. Khong co response thi ghi NOT_CAPTURED, khong dien gia tri suy doan.
6. Doi chieu Zoho outbound log cung sender, recipient, khoang gio va messageId neu co. Phan biet absence trong log gui thu voi absence cua SMTP connection/auth log.
7. Chi kiem tra runtime env metadata neu log cho thay transporter khong duoc tao: presence va target deployment, khong in gia tri/password/token. Khong reset env vo can cu.
8. Neu log khong du de ket luan: yeu cau integrator deploy logging patch toi thieu, sau do mot TEST canary co kiem soat. Khong lap lai nhieu don khi chua capture duoc request.

Output bat buoc: timeline `request -> commit -> verification -> mail start -> SMTP attempt -> SMTP result -> response`, moi buoc co evidence ID hoac UNKNOWN. Root cause chi duoc CONFIRMED khi co log/reproducer tuong ung voi request production.

## 5. Agent 2: Dieu tra API va mat email sau commit

1. Lap bang tat ca return sau RPC: commit moi, result sai cau truc, RPC timeout nhung DB da commit, verification read loi, payload mismatch, early replay, writer replay, unique-key reconciliation.
2. Moi nhanh ghi: don ton tai khong, verification dat khong, response nao, mail duoc goi may lan, retry cung key se lam gi.
3. Tai hien bang dependency injection/mock, khong gui SMTP that: commit thanh cong nhung response RPC bi mat; verification tam loi roi retry; SMTP that bai roi replay; hai request cung key chay dong thoi.
4. Danh gia test hien tai 'retry sends no duplicate email': no bao ve trung mail nhung khong chung minh email that bai se duoc phuc hoi. Bao cao do la khoang trong bao dam delivery.
5. Neu logging can thiet, de xuat event co request correlation + booking ID: commit_verified, commit_reconciled, replay_returned, email_dispatch_started, email_dispatch_finished. Ghi branch reason va elapsedMs; khong log payload/secret/full PII.
6. Chi patch flow duoc bang chung xac nhan. Khong gui mail truoc verification va khong bo validation de lam test pass.
7. Khong them unconditional send trong replay. Phai phan biet failed, accepted, unknown de tranh duplicate khi SMTP da nhan nhung response bi mat.
8. emailStatus.pending hien tai chi la response flag, khong phai BookingStatus va khong chung minh co job retry. Neu khong co queue thi khong mo ta voi nguoi dung la dang tu dong gui lai.

Output: reproduction truoc fix, patch nho nhat neu co du bang chung, tests sau fix, cac truong hop chua giai quyet. Neu retry can persistent state, ghi thiet ke va blocker rieng thay vi tu tao schema.

## 6. Agent 3: Dieu tra mailer va SMTP

1. Doc template generation, recipient normalization, synthetic skip, transporter construction, attachments, primary/fallback send va catch. Liet ke return/throw truoc sendMail.
2. Kiem tra ca recipient khach va BCC reception. Loi mot recipient co the khac ket qua recipient con lai; khong dung accepted.length > 0 de bao khach da duoc SMTP chap nhan.
3. Dung transport fake tai hien: template/attachment error; connect timeout; TLS error; auth rejection; recipient rejection; customer rejected nhung BCC accepted; primary fail/fallback accepted; unknown outcome sau DATA.
4. Giu SMTP error code, command, responseCode, attempt, port, elapsedMs va stage theo allowlist. Sanitize error text vi SMTP response co the chua dia chi. Khong bat raw SMTP debug tren production.
5. Chot return contract voi agent 2: ket qua customer la accepted/failed/unknown/skipped, messageId neu co, reasonCode va reception outcome rieng. 'accepted' chi la SMTP chap nhan, khong phai da vao inbox.
6. Rà fallback 587: tranh retry cung port khi primary da la 587; khong doi port de 'sua' auth/recipient error; outcome khong ro sau DATA khong duoc resend mu quang.
7. Khong doi provider, credentials, SPF/DKIM hay tang timeout theo suy doan. Neu bang chung cho thay Vercel runtime connection loi thi dung error code va kiem tra tu chinh deployment de chon fix.

Output: bang stage/error, unit reproducer, patch mailer neu can, contract de agent 2 tich hop. Local SMTP verify PASS khong du de danh dau production PASS.

## 7. Chon fix theo bang chung

| Bang chung thu duoc | Huong fix |
| --- | --- |
| Deployment SHA khac ban da review | Deploy dung revision vao dung project/alias, test lai mot canary |
| Reconciliation/replay bo qua mail chua tung duoc dispatch | Sua co che dispatch/recovery sau verified commit; can state chong trung truoc khi bat retry |
| Template/attachment throw truoc SMTP | Sua dung input/path/packaging va test tren runtime tuong ung |
| SMTP DNS/TCP/TLS/auth loi cu the | Sua dung cau hinh/runtime/provider rule theo log, verify tu production |
| Customer rejected nhung BCC accepted | Sua kiem tra recipient outcome; bao that bai customer, khong bao sent chung |
| Timeout sau commit | Doi chieu tong thoi gian DB+SMTP va server budget; thiet ke delivery co recovery neu can. Tang client timeout khong tu giai quyet mat mail |
| Khong co log/request de phan loai | Logging patch toi thieu va mot TEST canary; giu root cause UNCONFIRMED |

Neu can outbox rieng: integrator trinh cach enqueue ben vung, xu ly crash giua commit/enqueue, worker lease, retries co gioi han, accepted/unknown, cancellation/resend controls va tac dong den writer. Bang rieng khong tu dong dong nghia zero impact. Khong dua schema change vao patch khac mot cach ngam dinh.

## 8. Thu tu thuc hien va gate

1. Integrator chot base SHA, phan file va cung cap evidence template. Ba agent bat dau dieu tra song song.
2. Agent 1 thu bang chung; agent 2/3 tai hien cac duong loi bang mock. Mock PASS khong phai production PASS.
3. Integrator doi chieu: neu chua ro nguyen nhan, chi tich hop observability patch. Deploy dung target va lay mot canary co du timeline.
4. Chot root cause voi evidence, chon fix trong muc 7. Agent 2/3 hoan thien patch trong pham vi da chia.
5. Integrator review diff, doc huong dan Next trong node_modules/next/dist/docs truoc khi sua runtime API; chay typecheck, targeted tests va build theo repo.
6. Deploy revision da test, ghi deployment ID/SHA; chay production acceptance. Khong ket thuc o git push hoac local PASS.
7. Danh dau GO chi khi booking/admin/mail deu co bang chung; neu thieu inbox/admin evidence thi BLOCKED_ACCEPTANCE.

## 9. Tinh huong nghiem thu

| ID | Moi truong / tinh huong | Ket qua bat buoc |
| --- | --- | --- |
| E01 | Isolated: don moi, SMTP accepted | Mot commit, mot dispatch; customer accepted duoc ghi dung |
| E02 | Isolated: RPC false/empty, khong co don verified | Khong success booking va khong mail |
| E03 | Isolated: RPC response mat nhung don da commit | Khong tao don thu hai; co duong recovery email duoc test hoac blocker duoc cong bo |
| E04 | Isolated: verification read tam loi roi retry | Khong mail truoc verification; khong mat email vinh vien sau recovery |
| E05 | Isolated: SMTP fail sau commit | Booking van thanh cong; email outcome failed ro rang; khong doi NEW/WAITING |
| E06 | Isolated: retry sau SMTP accepted | Khong tao don moi va khong gui lai email da accepted |
| E07 | Isolated: hai submit cung key dong thoi | Mot booking; dispatch duoc kiem soat; khong duplicate do race |
| E08 | Isolated: BCC accepted, customer rejected | Khong bao customer sent; ghi dung recipient outcome |
| E09 | Isolated: SMTP timeout/unknown, client abort 20s | Khong danh dong abort voi booking failed; retry cung key; khong resend mu quang |
| E10 | Production: browser chon dich vu va submit TEST | Co booking ID, admin nhan dung don, SMTP accepted, Zoho outbound va khach nhan email tiep nhan yeu cau |

E01-E09 dung mocks/fixtures isolated; khong gay loi co y tren production. Template 5 ngon ngu kiem tra local (noi dung received, ten dich vu, ngay/gio, ma don, hotline), khong can tao 5 don that chi de test ban dich.

E10 dung email nghik22@gmail.com, ten/ghi chu prefix TEST, so dien thoai test da duoc cung cap (389898593; chuan hoa theo country code cua form). Chon ngay/gio hop le va gia tu catalog that. Khong tu sua/xoa don sau test. Chi mot agent/integrator submit; cac agent khac khong tu gui mail hay tao don.

Receipt can capture: deployment ID/SHA, request ID, booking ID, masked recipient, language, UTC/local timestamp, HTTP/branch, email stage/result/messageId, Zoho result va inbox confirmedAt. Evidence khong chua cookies, access token hoac secret.

## 10. Chu website can thao tac gi

- Neu agent khong truy cap duoc Vercel: cung cap Runtime Logs cua dung request va deployment detail; che secret. Khong can gui lai SMTP password.
- Xac nhan outbound log Zoho cho canary, va email that vao nghik22@gmail.com; khong dung messageId thay the xac nhan inbox.
- Xac nhan cung booking ID xuat hien trong admin dieu phoi. Khong can thay doi admin.
- Neu can schema/outbox moi, xem va duyet phuong an rieng truoc khi ap dung. Neu chi patch website thi theo quy trinh deployment da thong nhat.

## 11. Mau bao cao cuoi

Moi agent ghi: base SHA; file da doc/sua; finding; evidence; confidence (CONFIRMED/REPRODUCED_ONLY/UNKNOWN); patch; tests; blocker.

Integrator phai tra loi: (1) Don loi nao, (2) dung deployment nao, (3) email dung o buoc nao, (4) bang chung nguyen nhan, (5) fix gi, (6) before/after test, (7) admin va inbox E10 da xac nhan chua. Neu khong co bang chung, ghi chua xac dinh; khong xep hang nguyen nhan theo cam tinh.

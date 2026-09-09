# Plan: chan doan email qua API response, khong can Vercel login

## Muc tieu va bang chung

Don WB-10092026-011 tra success=true, idempotent=false, status=NEW, item status=WAITING, emailStatus={sent:false,pending:true}. Nhu vay lan request nay da vao duong don moi va khong bao gui mail thanh cong; chua xac dinh loi preparation, transporter hay SMTP. Khong tiep tuc quy nguyen nhan cho replay cua request nay.

Muc tieu: response cua lan TEST tiep theo cho biet giai doan va nhom loi email, khong can doc Vercel Logs. Day la patch chan doan, khong phai tu dong khac phuc delivery. Khong the truy hoi loi SMTP cua don 011 vi khong duoc luu.

## Pham vi

- Chi sua mailer, mapping response booking va test lien quan.
- Giu nguyen Bookings/BookingItems schema, NEW/WAITING, customer linkage, gia DB, idLegacy, RPC va admin dieu phoi.
- Giu nguyen thoi diem gui: sau commit da verified.
- Khong them outbox, table, migration, retry endpoint, doi SMTP provider/credentials hay tu resend don cu.
- Khong thay chinh sach fallback trong patch nay; chi ghi nhan ket qua moi attempt. Neu phat hien bug fallback, bao cao rieng.
- Khong hien ma ky thuat tren giao dien khach. Chi them vao API response de nghiem thu.
- Doc AGENTS.md, README.md, DEVELOPMENT_NOTES.md va huong dan Next local lien quan truoc khi sua. Chot base SHA thuc te; giu nguyen thay doi nguoi dung.

## Contract response can chot truoc khi code

Giu cac field hien huu sent/pending/messageId de tranh pha caller. Them diagnosticsVersion=1, outcome, stage, code va attempts. pending la legacy flag, khong phai DB status/queue. Khong mo ta la tu dong retry.

```json
{
  "success": true,
  "idempotent": false,
  "data": {
    "bookingId": "WB-...",
    "emailStatus": {
      "sent": false,
      "pending": true,
      "diagnosticsVersion": 1,
      "outcome": "failed",
      "stage": "smtp",
      "code": "SMTP_AUTH_FAILED",
      "attempts": [
        { "attempt": 1, "stage": "smtp", "code": "SMTP_AUTH_FAILED" },
        { "attempt": 2, "stage": "smtp", "code": "SMTP_AUTH_FAILED" }
      ]
    }
  }
}
```

Public enum:

- outcome: accepted | failed | unknown | skipped.
- stage: preparation | configuration | smtp | unknown.
- code: SMTP_ACCEPTED, EMAIL_PREPARATION_FAILED, EMAIL_CONFIGURATION_UNAVAILABLE, EMAIL_RECIPIENT_INVALID, EMAIL_TEST_SKIPPED, SMTP_AUTH_FAILED, SMTP_CONNECTION_FAILED, SMTP_TLS_FAILED, SMTP_TIMEOUT, SMTP_RECIPIENT_REJECTED, SMTP_DELIVERY_UNKNOWN, EMAIL_SEND_FAILED, EMAIL_RESULT_UNKNOWN, EMAIL_REPLAY_NOT_ATTEMPTED.
- attempts: toi da 2, theo so lan sendMail thuc su duoc goi; loi truoc SMTP tra []. Khong tao attempt gia cho transporter chua duoc tao.

Mapper response phai tao object moi theo allowlist. Khong spread return mailer hoac Error ra public response. Khong tra error.message, stack, response SMTP tho, hostname, username, password, token, recipient list hay code/command tuy y tu provider. messageId giu contract hien huu; khong xem no la inbox receipt.

Neu fallback thanh cong sau primary fail: sent=true, outcome=accepted va code=SMTP_ACCEPTED; attempts van giu nhom loi primary va accepted fallback. Neu outcome khong ro thi unknown, khong goi la failed chac chan.

## Phan cong 3 agent

### Agent 1: Mailer va safe classification

So huu: src/lib/mailer.ts, scripts/test-mailer-hardening.ts, plans/email-api-diagnostics-20260910/agent-1.md.

1. Doc tat ca return/throw truoc va sau sendMail. Them result type gon trong mailer, khong rewrite template.
2. Them bien stage truoc cac khoi preparation, transporter va sendMail. Bao dam catch co booking context hop le; khong phat sinh loi moi trong catch.
3. Phan loai theo error.code, responseCode va command co cau truc. Vi du EAUTH/auth rejection -> SMTP_AUTH_FAILED; DNS/connect code -> SMTP_CONNECTION_FAILED; TLS code -> SMTP_TLS_FAILED. Khong suy auth chi vi message chua chu AUTH.
4. Timeout chi cho biet timeout; neu khong biet SMTP da nhan DATA hay chua thi outcome=unknown. Loi khong nhan dien tra EMAIL_SEND_FAILED/unknown, khong doan.
5. Loi tao template truoc sendMail -> EMAIL_PREPARATION_FAILED; transporter null -> EMAIL_CONFIGURATION_UNAVAILABLE. Khong ket luan thieu env production tu code nay neu chua co request evidence.
6. Kiem tra customer trong accepted/rejected khi sendMail resolve. BCC accepted khong du de bao customer accepted. Thieu recipient evidence tra EMAIL_RESULT_UNKNOWN. Sua fake transporters cho tra accepted/rejected thuc te, khong coi messageId-only la accepted.
7. Error.accepted tai RCPT khong chung minh message DATA da duoc chap nhan. Khong tra sent=true tu accepted list cua error.
8. Synthetic skip tra skipped, khong tao messageId gia nhu da gui. Khong gui email that trong tests.
9. Bao cao chinh xac cac semantic correction (partial recipient, synthetic skip) va tac dong caller; giu patch gon, tranh he thong abstraction lon.

### Agent 2: Mapping API response

So huu: src/app/api/bookings/route.ts, scripts/test-go-live-api.mjs, plans/email-api-diagnostics-20260910/agent-2.md.

1. Dung contract tren de viet mapping allowlist. Trong luc Agent 1 code, dung stub theo result contract; khong sua mailer/type file cua Agent 1.
2. Don moi: map result vao emailStatus sau verification; giu HTTP success cho booking da commit du mail failed/unknown.
3. Mailer throw: tra diagnostics unknown + EMAIL_SEND_FAILED; khong dua noi dung exception ra response. Result rong/sai cau truc -> EMAIL_RESULT_UNKNOWN, khong bao sent.
4. Replay: khong gui lai; neu them emailStatus thi outcome=unknown, code=EMAIL_REPLAY_NOT_ATTEMPTED, attempts=[]; khong khang dinh email cu that bai hay da gui.
5. Cac loi booking truoc verification van giu response hien huu, khong gui mail.
6. Giu response field cu, UI tiep nhan yeu cau va admin flow. Log chi dung field da sanitize.

### Agent 3: Review doc lap va acceptance

So huu: scripts/test-email-diagnostics-contract.mjs (neu can), plans/email-api-diagnostics-20260910/agent-3.md. Khong sua production code Agent 1/2.

1. Review diff de phat hien thay doi ngoai pham vi va public data leak.
2. Kiem tra sentinel password/token/email trong error.message, response, stack va field tuy y khong xuat hien trong diagnostics/log moi.
3. Tai hien partial acceptance, no recipient arrays, SMTP error sau DATA, primary fail/fallback success, configuration/preparation failure.
4. Chuan bi checklist capture request production: URL, UTC submit, bookingId, idempotent, diagnosticsVersion, outcome/stage/code/attempts va admin/inbox evidence.
5. Chi integrator hoac chu website tao mot TEST; agent khong tao don/email rieng.

## Thu tu tich hop

1. Integrator chot shared result contract va base SHA. Agent 1/2 lam file rieng song song; Agent 3 chuan bi test/review.
2. Agent 1 bao result type cuoi; Agent 2 doi chieu mapper; integrator review 2 diff cung nhau. Khong commit code dang cho contract tu agent khac.
3. Chay typecheck, API mock, mailer tests, diagnostics tests va production build. Existing warnings tach rieng. Khong danh dau mock PASS thanh delivery PASS.
4. Chot commit scoped. Xac minh branch deployment thuc te truoc push; khong mac dinh git push = deployed.
5. Chu website tao mot don TEST tren production va gui Response. Quyen browser hien dang chan oria-spa.vercel.app: agent khong di vong bang curl/API/alternate browser de tu submit.
6. Response phai co diagnosticsVersion=1. Neu thieu thi chua chung minh ban moi da phuc vu request; khong tao them don vo han.
7. Doi chieu code voi stage/attempts de chon fix cu the. Neu code unknown thi bo sung chan doan tai diem chua ro, khong doi credentials/provider theo suy doan.

## Test bat buoc

| Case | Ky vong |
| --- | --- |
| Don moi, customer accepted | Booking success; sent=true; accepted; SMTP_ACCEPTED |
| SMTP auth rejection | Booking success; sent=false; SMTP_AUTH_FAILED |
| DNS/connect failure | Booking success; SMTP_CONNECTION_FAILED |
| TLS failure | SMTP_TLS_FAILED, khong lo raw provider response |
| Timeout/ket qua DATA khong ro | outcome=unknown; khong khang dinh chua gui |
| Template throw | EMAIL_PREPARATION_FAILED; 0 SMTP attempts |
| Transporter null | EMAIL_CONFIGURATION_UNAVAILABLE; 0 SMTP attempts |
| Customer rejected, BCC accepted | sent=false; SMTP_RECIPIENT_REJECTED |
| Primary fail, fallback accepted | sent=true; 2 attempts, giu ca ket qua |
| Mailer throw/result malformed | Safe fallback diagnostics; booking van thanh cong |
| Replay | Khong gui lai; EMAIL_REPLAY_NOT_ATTEMPTED |
| Booking validation/verification fail | Khong mail va khong booking success gia |
| Error chua secrets/PII | Khong co sentinel trong diagnostics/log moi |
| Synthetic recipient | skipped; khong SMTP; khong fake sent |

## Nghiem thu va phuong an fix tiep theo

Done patch khi tests/build PASS, public diagnostics chi co allowlist va response production co version 1. Done dieu tra khi response TEST xac dinh duoc giai doan/nhom loi. Done delivery chi khi sua nguyen nhan, admin nhan dung don va khach xac nhan email thuc nhan.

- AUTH -> doi chieu credentials/quyen SMTP tren deployment; khong doi mat khau mu quang.
- CONNECTION/TLS/TIMEOUT -> kiem tra dung ket noi/runtime; dung attempt evidence de quyet dinh cau hinh.
- PREPARATION -> sua dung template/input/asset throw.
- RECIPIENT_REJECTED -> xem rejection qua kenh server duoc phep, sua recipient/sender theo bang chung.
- UNKNOWN -> chua du ket luan; ghi ro can them bang chung nao.

Bao cao cuoi: file thay doi, base/final SHA, tests, sample response da che data, code production nhan duoc, root cause CONFIRMED hay UNKNOWN, buoc con lai. Khong claim email da duoc giao chi vi SMTP accepted.

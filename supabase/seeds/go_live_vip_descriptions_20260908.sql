-- REVIEW/STAGING ONLY. Not applied to production.
-- Source: read-only public /api/services snapshot, 2026-09-08.
-- Fill 42 missing JP/KR/CN fields for NHP0001-NHP0014 only when VI/EN
-- still exactly match the reviewed source. Preserve existing/empty translations.
-- No price, duration, status, name, or media columns are updated.
BEGIN;
WITH source(id, therapists, minutes) AS (VALUES
  ('NHP0001',1,60), ('NHP0002',1,70), ('NHP0003',1,90), ('NHP0004',1,120),
  ('NHP0005',1,150), ('NHP0006',1,180), ('NHP0007',1,240),
  ('NHP0008',2,60), ('NHP0009',2,70), ('NHP0010',2,90), ('NHP0011',2,120),
  ('NHP0012',2,150), ('NHP0013',2,180), ('NHP0014',2,240)
), translated AS (
  SELECT id, therapists, minutes, jsonb_build_object(
    'jp', format('セラピスト%s名による%s分間のプレミアムVIPサービス。',therapists,minutes),
    'kr', format('테라피스트 %s명이 %s분 동안 제공하는 프리미엄 VIP 서비스.',therapists,minutes),
    'cn', format('由%s位技师提供的%s分钟高端VIP服务。',therapists,minutes)
  ) value FROM source
), patches AS (
  SELECT s.id, jsonb_object_agg(t.key,t.value) patch
  FROM public."Services" s JOIN translated ON translated.id=s.id
  CROSS JOIN LATERAL jsonb_each(translated.value) t
  WHERE jsonb_typeof(s.description::jsonb)='object'
    AND s.description::jsonb->>'vi'=format('Dịch vụ VIP cao cấp với %s KTV trong %s phút.',therapists,minutes)
    AND s.description::jsonb->>'en'=format('Premium VIP service with %s therapist%s for %s minutes.',therapists,CASE WHEN therapists=1 THEN '' ELSE 's' END,minutes)
    AND (NOT s.description::jsonb ? t.key OR s.description::jsonb->t.key='null'::jsonb)
  GROUP BY s.id
)
UPDATE public."Services" s SET description=s.description::jsonb || patches.patch
FROM patches WHERE s.id=patches.id
RETURNING s.id, s.description;
COMMIT;

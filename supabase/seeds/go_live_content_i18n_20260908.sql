-- Luna-1 staging preview only. Do not run against production without review.
-- This seed fills missing JSON paths recursively; existing custom values and
-- intentional empty strings remain unchanged. It never touches Services prices,
-- IDs, durations, media, or status.

CREATE OR REPLACE FUNCTION pg_temp.webbooking_fill_missing(target JSONB, defaults JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB := COALESCE(target, '{}'::JSONB);
  item RECORD;
BEGIN
  IF jsonb_typeof(result) <> 'object' OR jsonb_typeof(defaults) <> 'object' THEN
    RETURN COALESCE(target, defaults);
  END IF;

  FOR item IN SELECT key, value FROM jsonb_each(defaults) LOOP
    IF NOT (result ? item.key) OR result -> item.key IS NULL THEN
      result := jsonb_set(result, ARRAY[item.key], item.value, true);
    ELSIF jsonb_typeof(result -> item.key) = 'object' AND jsonb_typeof(item.value) = 'object' THEN
      result := jsonb_set(result, ARRAY[item.key], pg_temp.webbooking_fill_missing(result -> item.key, item.value), true);
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

WITH defaults AS (
  SELECT $$
  {
    "narratives": {
      "body-care": {
        "vi": {
          "eyebrow": "Body Massage Perspective",
          "headline": "Body Massage\nNghệ thuật xoa bóp thủ công tại Oria Spa",
          "lead": "Body Massage tại Oria Spa là nghệ thuật xoa bóp 100% thủ công bằng đôi bàn tay của người nghệ nhân.",
          "signature": ["100% thủ công", "Hơi ấm con người", "Lực ấn linh hoạt", "Trải nghiệm cá nhân hóa"],
          "pullQuote": "Giữa một cuộc sống ngày càng phụ thuộc vào thiết bị và máy móc, Oria Spa lựa chọn giữ lại giá trị nguyên bản của massage: sự chăm sóc trực tiếp giữa con người với con người.",
          "pullSign": "Triết lý Oria Spa"
        },
        "en": {
          "eyebrow": "Body Massage Perspective",
          "headline": "Body Massage\nThe Art of Manual Therapy at Oria Spa",
          "lead": "Body Massage at Oria Spa is a 100% manual art performed by the hands of our artisans.",
          "signature": ["100% manual", "Human warmth", "Adaptive pressure", "Personalized experience"],
          "pullQuote": "In a world increasingly dependent on devices and machines, Oria Spa chooses to preserve the original value of massage: direct human-to-human care.",
          "pullSign": "Oria Spa Philosophy"
        },
        "jp": {
          "eyebrow": "ボディマッサージの理念",
          "headline": "ボディマッサージ\nOria Spa の手技の芸術",
          "lead": "Oria Spa のボディマッサージは、セラピストの手だけで行う手技の芸術です。",
          "signature": ["100% 手技", "人のぬくもり", "自在な圧", "パーソナルケア"],
          "pullQuote": "機械やデバイスに頼る時代だからこそ、Oria Spa は人と人が直接ふれ合うマッサージ本来の価値を大切にします。",
          "pullSign": "Oria Spa の哲学"
        },
        "kr": {
          "eyebrow": "바디 마사지 철학",
          "headline": "바디 마사지\nOria Spa 수기 케어의 예술",
          "lead": "Oria Spa의 바디 마사지는 테라피스트의 손으로 완성되는 100% 수기 케어입니다.",
          "signature": ["100% 수기 케어", "사람의 온기", "맞춤 압력", "개인화된 경험"],
          "pullQuote": "기계와 기기에 점점 의존하는 시대에도 Oria Spa는 사람과 사람 사이의 직접적인 돌봄이라는 마사지의 본질을 지킵니다.",
          "pullSign": "Oria Spa 철학"
        },
        "cn": {
          "eyebrow": "身体按摩理念",
          "headline": "身体按摩\nOria Spa 的手工按摩艺术",
          "lead": "Oria Spa 的身体按摩是由技师双手完成的纯手工艺术。",
          "signature": ["纯手工护理", "人的温度", "灵活力度", "个性化体验"],
          "pullQuote": "在越来越依赖设备与机器的生活中，Oria Spa 选择保留按摩最本真的价值：人与人之间直接而温柔的照护。",
          "pullSign": "Oria Spa 理念"
        }
      }
    }
  }
  $$::JSONB AS value
)
INSERT INTO public."WebBookingContent" (key, value)
SELECT 'pure_relaxation_media', value
FROM defaults
WHERE NOT EXISTS (SELECT 1 FROM public."WebBookingContent" WHERE key = 'pure_relaxation_media');

WITH defaults AS (
  SELECT value FROM public."WebBookingContent" WHERE key = 'pure_relaxation_media'
), payload AS (
  SELECT $$
  {"narratives": {"body-care": {"vi": {"eyebrow": "Body Massage Perspective"}, "en": {"eyebrow": "Body Massage Perspective"}, "jp": {"eyebrow": "ボディマッサージの理念"}, "kr": {"eyebrow": "바디 마사지 철학"}, "cn": {"eyebrow": "身体按摩理念"}}}}
  $$::JSONB AS value
)
UPDATE public."WebBookingContent" AS content
SET value = pg_temp.webbooking_fill_missing(content.value, payload.value)
FROM payload
WHERE content.key = 'pure_relaxation_media';

-- NHP0001-NHP0014 are intentionally excluded until a staging export provides
-- their effective VI/EN descriptions. Copying EN into other locales would be
-- false coverage and would violate the no-invented-claims rule.

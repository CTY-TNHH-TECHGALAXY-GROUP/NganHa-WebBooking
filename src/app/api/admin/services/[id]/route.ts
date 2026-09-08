import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';

const SERVICE_LOCALES = ['vi', 'en', 'jp', 'kr', 'cn'] as const;
const NAME_COLUMNS = { vi: 'nameVN', en: 'nameEN', jp: 'nameJP', kr: 'nameKR', cn: 'nameCN' } as const;

const normalizeDescription = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const description: Record<string, any> = { ...source };
  for (const locale of SERVICE_LOCALES) {
    const candidate = source[locale] ?? source[locale.toUpperCase()] ?? (locale === 'vi' ? source.vn ?? source.VN : undefined);
    if (candidate !== undefined) {
      if (typeof candidate !== 'string' || candidate.length > 4000) return null;
      description[locale] = candidate;
    }
  }
  return description;
};

const localeSnapshot = (value: unknown) => {
  const description = normalizeDescription(value);
  if (!description) return null;
  return SERVICE_LOCALES.reduce<Record<string, string | undefined>>((snapshot, locale) => {
    if (Object.prototype.hasOwnProperty.call(description, locale)) snapshot[locale] = description[locale];
    return snapshot;
  }, {});
};

const normalizeNames = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const names: Record<string, string> = {};
  for (const locale of SERVICE_LOCALES) {
    const candidate = source[locale] ?? source[locale.toUpperCase()];
    if (candidate !== undefined) {
      if (typeof candidate !== 'string' || candidate.length > 500) return null;
      names[locale] = candidate;
    }
  }
  return names;
};

const namesSnapshot = (row: Record<string, unknown>) => SERVICE_LOCALES.reduce<Record<string, string>>((snapshot, locale) => {
  snapshot[locale] = typeof row[NAME_COLUMNS[locale]] === 'string' ? row[NAME_COLUMNS[locale]] as string : '';
  return snapshot;
}, {});

export const PUT = withAuth(async (req, ctx, params) => {
  const body = await req.json();
  const { id } = await params;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return apiResponse.error('Thiếu cấu hình SUPABASE_SERVICE_ROLE_KEY', 'CONFIG_ERROR', 500);
  }

  const update: Record<string, unknown> = {
    media_url: body.media_url,
    media_type: body.media_type,
    nameVN: body.nameVN,
    nameEN: body.nameEN,
    nameKR: body.nameKR,
    nameJP: body.nameJP,
    nameCN: body.nameCN,
    priceVND: body.priceVND,
    duration: body.duration,
    category: body.category,
    isActive: body.isActive,
  };

  // Descriptions belong to Services, alongside the existing multilingual names.
  // Do not mirror this catalog data into WebBookingContent.
  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    const description = normalizeDescription(body.description);
    if (!description) {
      return apiResponse.error('description phải là object locale -> chuỗi hợp lệ.', 'VALIDATION_ERROR', 400);
    }
    update.description = description;
  }

  const { data, error } = await supabaseAdmin
    .from('Services')
    .update(update)
    .eq('id', id)
    .select();

  if (error) {
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  if (!data || data.length === 0) {
    return apiResponse.error('Không tìm thấy dịch vụ hoặc không có quyền cập nhật (RLS).', 'NOT_FOUND', 404);
  }

  return apiResponse.success(data[0]);
});

/** Catalog-only patch used by the multilingual editor; pricing and duration are untouched. */
export const PATCH = withAuth(async (req, _ctx, params) => {
  const body = await req.json();
  const { id } = await params;
  const hasDescription = Object.prototype.hasOwnProperty.call(body || {}, 'description');
  const hasNames = Object.prototype.hasOwnProperty.call(body || {}, 'names');
  const description = hasDescription ? normalizeDescription(body?.description) : null;
  const names = hasNames ? normalizeNames(body?.names) : null;
  if ((hasDescription && !description) || (hasNames && !names) || (!hasDescription && !hasNames)) {
    return apiResponse.error('description/names phải là object locale -> chuỗi hợp lệ.', 'VALIDATION_ERROR', 400);
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return apiResponse.error('Thiếu cấu hình SUPABASE_SERVICE_ROLE_KEY', 'CONFIG_ERROR', 500);
  }

  const expectedDescription = body?.expectedDescription === undefined
    ? null
    : localeSnapshot(body.expectedDescription);
  if (body?.expectedDescription !== undefined && !expectedDescription) {
    return apiResponse.error('expectedDescription phải là object locale -> chuỗi hợp lệ.', 'VALIDATION_ERROR', 400);
  }
  const expectedNames = body?.expectedNames === undefined ? null : normalizeNames(body.expectedNames);
  if (body?.expectedNames !== undefined && !expectedNames) {
    return apiResponse.error('expectedNames phải là object locale -> chuỗi hợp lệ.', 'VALIDATION_ERROR', 400);
  }

  const { data: current, error: readError } = await supabaseAdmin
    .from('Services')
    .select('description, nameVN, nameEN, nameJP, nameKR, nameCN')
    .eq('id', id)
    .maybeSingle();
  if (readError) return apiResponse.error(readError.message, 'DB_ERROR', 500);
  if (!current) return apiResponse.error('Không tìm thấy dịch vụ.', 'NOT_FOUND', 404);
  if (expectedDescription && JSON.stringify(localeSnapshot(current.description)) !== JSON.stringify(expectedDescription)) {
    return apiResponse.error('Mô tả dịch vụ đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);
  }
  if (expectedNames && JSON.stringify(namesSnapshot(current)) !== JSON.stringify(expectedNames)) {
    return apiResponse.error('Tên dịch vụ đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);
  }

  const update: Record<string, unknown> = {};
  if (description) update.description = description;
  if (names) {
    for (const locale of SERVICE_LOCALES) {
      if (Object.prototype.hasOwnProperty.call(names, locale)) update[NAME_COLUMNS[locale]] = names[locale];
    }
  }
  let query = supabaseAdmin
    .from('Services')
    .update(update)
    .eq('id', id);
  if (expectedDescription) query = query.eq('description', current.description);
  if (expectedNames) {
    for (const locale of SERVICE_LOCALES) {
      const column = NAME_COLUMNS[locale];
      query = current[column] === null || current[column] === undefined
        ? query.is(column, null)
        : query.eq(column, current[column]);
    }
  }

  const { data, error } = await query
    .select('id, description, nameVN, nameEN, nameJP, nameKR, nameCN');

  if (error) return apiResponse.error(error.message, 'DB_ERROR', 500);
  if (!data || data.length === 0) return apiResponse.error('Không tìm thấy dịch vụ.', 'NOT_FOUND', 404);
  return apiResponse.success({
    ...data[0],
    names: namesSnapshot(data[0]),
  });
});

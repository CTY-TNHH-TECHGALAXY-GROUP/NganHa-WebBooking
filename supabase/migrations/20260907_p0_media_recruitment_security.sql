-- ==============================================================================
-- Migration: 20260907_p0_media_recruitment_security.sql
-- Purpose: Phase P0-A: Media, RLS, and Recruitment Security Hardening
-- 1. Restrict storage mutations on 'media-uploads' to active admins only
-- 2. Restrict public."MarketingMedia" mutations to active admins only
-- 3. Make 'recruitment_images' bucket private and restrict to active admins
-- 4. Restrict public.recruitment_applications PII access to active admins
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper function: check if authenticated user is an active admin
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."WebbookingAdminUsers"
    WHERE user_id = auth.uid()
      AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO anon;

-- ------------------------------------------------------------------------------
-- 2. Hardening MarketingMedia Table
-- ------------------------------------------------------------------------------
ALTER TABLE public."MarketingMedia" ENABLE ROW LEVEL SECURITY;

-- Drop insecure public write policies
DROP POLICY IF EXISTS "Cho phép admin sửa MarketingMedia" ON public."MarketingMedia";
DROP POLICY IF EXISTS "Cho phép tất cả đọc MarketingMedia" ON public."MarketingMedia";
DROP POLICY IF EXISTS "Allow active admin to insert MarketingMedia" ON public."MarketingMedia";
DROP POLICY IF EXISTS "Allow active admin to update MarketingMedia" ON public."MarketingMedia";
DROP POLICY IF EXISTS "Allow active admin to delete MarketingMedia" ON public."MarketingMedia";

-- Public read-only for published marketing assets
CREATE POLICY "Cho phép tất cả đọc MarketingMedia"
ON public."MarketingMedia"
FOR SELECT
USING (true);

-- Mutations restricted to authenticated active admins
CREATE POLICY "Allow active admin to insert MarketingMedia"
ON public."MarketingMedia"
FOR INSERT
TO authenticated
WITH CHECK (public.is_active_admin());

CREATE POLICY "Allow active admin to update MarketingMedia"
ON public."MarketingMedia"
FOR UPDATE
TO authenticated
USING (public.is_active_admin())
WITH CHECK (public.is_active_admin());

CREATE POLICY "Allow active admin to delete MarketingMedia"
ON public."MarketingMedia"
FOR DELETE
TO authenticated
USING (public.is_active_admin());

-- ------------------------------------------------------------------------------
-- 3. Hardening Storage: media-uploads Bucket
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-uploads', 'media-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop insecure policies allowing anonymous write/update/delete
DROP POLICY IF EXISTS "Cho phép tất cả xem media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép tải file lên media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép sửa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép xóa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép admin tải file lên media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép admin sửa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép admin xóa file trong media-uploads" ON storage.objects;

-- Allow public SELECT (read-only) for published assets in media-uploads
CREATE POLICY "Cho phép tất cả xem media-uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media-uploads');

-- Only authenticated active admins can upload to media-uploads
CREATE POLICY "Cho phép admin tải file lên media-uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-uploads'
  AND public.is_active_admin()
);

-- Only authenticated active admins can update files in media-uploads
CREATE POLICY "Cho phép admin sửa file trong media-uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-uploads'
  AND public.is_active_admin()
);

-- Only authenticated active admins can delete files in media-uploads
CREATE POLICY "Cho phép admin xóa file trong media-uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-uploads'
  AND public.is_active_admin()
);

-- ------------------------------------------------------------------------------
-- 4. Hardening Storage: recruitment_images Bucket (Private)
-- ------------------------------------------------------------------------------
-- Ensure bucket is marked private (public = false)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recruitment_images', 'recruitment_images', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Drop insecure public read/write policies
DROP POLICY IF EXISTS "Allow public to upload recruitment images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view recruitment images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to delete recruitment images" ON storage.objects;
DROP POLICY IF EXISTS "Allow active admin to view recruitment images" ON storage.objects;
DROP POLICY IF EXISTS "Allow active admin to upload recruitment images" ON storage.objects;
DROP POLICY IF EXISTS "Allow active admin to update recruitment images" ON storage.objects;
DROP POLICY IF EXISTS "Allow active admin to delete recruitment images" ON storage.objects;

-- Only authenticated active admins can read candidate files
CREATE POLICY "Allow active admin to view recruitment images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'recruitment_images'
  AND public.is_active_admin()
);

-- Only authenticated active admins can directly upload candidate files
CREATE POLICY "Allow active admin to upload recruitment images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recruitment_images'
  AND public.is_active_admin()
);

-- Only authenticated active admins can update candidate files
CREATE POLICY "Allow active admin to update recruitment images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recruitment_images'
  AND public.is_active_admin()
);

-- Only authenticated active admins can delete candidate files
CREATE POLICY "Allow active admin to delete recruitment images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recruitment_images'
  AND public.is_active_admin()
);

-- ------------------------------------------------------------------------------
-- 5. Hardening Table: recruitment_applications
-- ------------------------------------------------------------------------------
ALTER TABLE public.recruitment_applications ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow public insert to recruitment_applications" ON public.recruitment_applications;
DROP POLICY IF EXISTS "Allow authenticated users to read recruitment_applications" ON public.recruitment_applications;
DROP POLICY IF EXISTS "Allow authenticated users to update recruitment_applications" ON public.recruitment_applications;
DROP POLICY IF EXISTS "Allow authenticated users to delete recruitment_applications" ON public.recruitment_applications;
DROP POLICY IF EXISTS "Allow active admin to read recruitment_applications" ON public.recruitment_applications;
DROP POLICY IF EXISTS "Allow active admin to update recruitment_applications" ON public.recruitment_applications;
DROP POLICY IF EXISTS "Allow active admin to delete recruitment_applications" ON public.recruitment_applications;

-- Only active admins can read candidate PII
CREATE POLICY "Allow active admin to read recruitment_applications"
ON public.recruitment_applications
FOR SELECT
TO authenticated
USING (public.is_active_admin());

-- Only active admins can update candidate applications
CREATE POLICY "Allow active admin to update recruitment_applications"
ON public.recruitment_applications
FOR UPDATE
TO authenticated
USING (public.is_active_admin())
WITH CHECK (public.is_active_admin());

-- Only active admins can delete candidate applications
CREATE POLICY "Allow active admin to delete recruitment_applications"
ON public.recruitment_applications
FOR DELETE
TO authenticated
USING (public.is_active_admin());

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { validateUpload, UploadValidationError, generateSecureId } from '@/lib/uploads/validateUpload';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const uploadedPaths: string[] = [];
  const supabase = getSupabaseAdmin();

  try {
    const formData = await req.formData();

    // 1. Validate and upload applicant photo (mandatory)
    const photoFile = formData.get('photo') as File | null;
    const certificateFile = formData.get('certificatePhoto') as File | null;

    if (!photoFile || !(photoFile instanceof Blob) || photoFile.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Thiếu ảnh toàn thân' },
        { status: 400 }
      );
    }

    // Unguessable UUID folder per application submission - NEVER include applicant PII in paths
    const applicationId = generateSecureId();
    const folder = `applications/${applicationId}`;

    // Validate photo: strictly image, max 10MB, check magic bytes and dangerous payloads
    const validatedPhoto = await validateUpload(photoFile, {
      allowedKinds: ['image'],
      maxSizeBytes: 10 * 1024 * 1024,
      folder
    });

    const { error: photoUploadErr } = await supabase.storage
      .from('recruitment_images')
      .upload(validatedPhoto.storagePath, validatedPhoto.buffer, {
        contentType: validatedPhoto.mimeType,
        upsert: false,
      });

    if (photoUploadErr) {
      console.error('[API /recruitment] Photo upload error:', photoUploadErr);
      throw new Error(`Upload ảnh chân dung thất bại: ${photoUploadErr.message}`);
    }
    uploadedPaths.push(validatedPhoto.storagePath);

    // 2. Validate and upload certificate photo if present
    let certificateStoragePath = '';
    if (certificateFile && certificateFile instanceof Blob && certificateFile.size > 0) {
      const validatedCert = await validateUpload(certificateFile, {
        allowedKinds: ['image'],
        maxSizeBytes: 10 * 1024 * 1024,
        folder
      });

      const { error: certUploadErr } = await supabase.storage
        .from('recruitment_images')
        .upload(validatedCert.storagePath, validatedCert.buffer, {
          contentType: validatedCert.mimeType,
          upsert: false,
        });

      if (certUploadErr) {
        console.error('[API /recruitment] Certificate upload error:', certUploadErr);
        throw new Error(`Upload ảnh chứng chỉ thất bại: ${certUploadErr.message}`);
      }
      certificateStoragePath = validatedCert.storagePath;
      uploadedPaths.push(validatedCert.storagePath);
    }

    // 3. Prepare payload for recruitment_applications
    // Store unguessable storage paths (can be resolved with signed URLs by authorized admins)
    const payload = {
      full_name: formData.get('fullName')?.toString()?.trim() || '',
      dob: formData.get('dob')?.toString()?.trim() || '',
      phone: formData.get('phone')?.toString()?.trim() || '',
      email: formData.get('email')?.toString()?.trim() || null,
      address: formData.get('address')?.toString()?.trim() || '',
      languages: formData.get('languages')?.toString()?.trim() || null,
      height: formData.get('height') ? Number(formData.get('height')) : null,
      weight: formData.get('weight') ? Number(formData.get('weight')) : null,

      photo_url: validatedPhoto.storagePath,
      certificate_url: certificateStoragePath,

      experience: formData.get('experience')?.toString()?.trim() || '',
      employment_status: formData.get('employmentStatus')?.toString()?.trim() || '',
      job_change_reason: formData.get('jobChangeReason')?.toString()?.trim() || null,
      previous_company: formData.get('previousCompany')?.toString()?.trim() || '',
      previous_position: formData.get('previousPosition')?.toString()?.trim() || '',
      previous_duration: formData.get('previousDuration')?.toString()?.trim() || '',
      previous_reason: formData.get('previousReason')?.toString()?.trim() || '',
      previous_duties: formData.get('previousDuties')?.toString()?.trim() || '',

      applied_position: formData.get('course')?.toString()?.trim() || '',
      start_date: formData.get('startDate')?.toString()?.trim() || '',
      contact_method: formData.get('contactMethod')?.toString()?.trim() || '',
      referral_source: formData.get('referralSource')?.toString()?.trim() || '',
      message: formData.get('message')?.toString()?.trim() || '',

      status: 'new'
    };

    // Validate required fields
    if (!payload.full_name || !payload.phone || !payload.address) {
      throw new UploadValidationError(
        'Vui lòng điền đầy đủ các thông tin bắt buộc (họ tên, số điện thoại, địa chỉ).',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    // 4. Insert into recruitment_applications
    const { error: dbError } = await supabase.from('recruitment_applications').insert([payload]);

    if (dbError) {
      console.error('[API /recruitment] Database insert error:', dbError);
      throw new Error(`Lưu thông tin thất bại: ${dbError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // 5. Rollback/cleanup orphaned uploaded files if DB insertion or secondary upload failed
    if (uploadedPaths.length > 0) {
      try {
        console.warn(`[API /recruitment] Cleaning up ${uploadedPaths.length} orphaned uploaded file(s)...`);
        await supabase.storage.from('recruitment_images').remove(uploadedPaths);
      } catch (cleanupErr) {
        console.error('[API /recruitment] Failed to clean up orphaned storage files:', cleanupErr);
      }
    }

    if (err instanceof UploadValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }

    console.error('[API /recruitment] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}

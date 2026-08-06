import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const supabase = getSupabaseAdmin();

    // Hàm hỗ trợ upload file lên Supabase Storage
    const uploadFile = async (file: File | null) => {
      if (!file || !(file instanceof Blob) || file.size === 0) return '';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Chèn timestamp để tránh trùng tên file
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('recruitment_images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Lỗi upload file:', error);
        throw new Error(`Upload ảnh thất bại: ${error.message}`);
      }

      // Lấy public URL
      const { data: urlData } = supabase.storage
        .from('recruitment_images')
        .getPublicUrl(fileName);
        
      return urlData.publicUrl;
    };

    // 1. Upload ảnh
    const photoFile = formData.get('photo') as File | null;
    const certificateFile = formData.get('certificatePhoto') as File | null;

    if (!photoFile) {
      return NextResponse.json({ success: false, error: 'Thiếu ảnh toàn thân' }, { status: 400 });
    }

    const photo_url = await uploadFile(photoFile);
    const certificate_url = await uploadFile(certificateFile); // Có thể rỗng nếu user không nộp

    // 2. Chuẩn bị payload để lưu DB
    const payload = {
      full_name: formData.get('fullName')?.toString() || '',
      dob: formData.get('dob')?.toString() || '',
      phone: formData.get('phone')?.toString() || '',
      email: formData.get('email')?.toString() || null,
      address: formData.get('address')?.toString() || '',
      languages: formData.get('languages')?.toString() || null,
      height: formData.get('height') ? Number(formData.get('height')) : null,
      weight: formData.get('weight') ? Number(formData.get('weight')) : null,
      
      photo_url,
      certificate_url,
      
      experience: formData.get('experience')?.toString() || '',
      employment_status: formData.get('employmentStatus')?.toString() || '',
      job_change_reason: formData.get('jobChangeReason')?.toString() || null,
      previous_company: formData.get('previousCompany')?.toString() || '',
      previous_position: formData.get('previousPosition')?.toString() || '',
      previous_duration: formData.get('previousDuration')?.toString() || '',
      previous_reason: formData.get('previousReason')?.toString() || '',
      previous_duties: formData.get('previousDuties')?.toString() || '',
      
      applied_position: formData.get('course')?.toString() || '',
      start_date: formData.get('startDate')?.toString() || '',
      contact_method: formData.get('contactMethod')?.toString() || '',
      referral_source: formData.get('referralSource')?.toString() || '',
      message: formData.get('message')?.toString() || '',
      
      status: 'new'
    };

    // 3. Insert vào bảng recruitment_applications
    const { error } = await supabase.from('recruitment_applications').insert([payload]);

    if (error) {
      console.error('Lỗi insert DB:', error);
      throw new Error(`Lưu thông tin thất bại: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /recruitment] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}

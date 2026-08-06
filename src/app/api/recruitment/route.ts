import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Hàm hỗ trợ loại bỏ dấu Tiếng Việt và các ký tự đặc biệt để tạo tên folder hợp lệ
function removeVietnameseTones(str: string) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
  str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
  str = str.replace(/đ/g,"d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); 
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); 
  str = str.replace(/ + /g," ");
  str = str.trim();
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
  return str.replace(/\s+/g, '-').toLowerCase();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const supabase = getSupabaseAdmin();
    
    // Lấy tên ứng viên và tạo tên folder (quy ước: full_name + created_at)
    const rawFullName = formData.get('fullName')?.toString() || 'ung vien';
    const folderName = `${removeVietnameseTones(rawFullName)}-${Date.now()}`;

    // Hàm hỗ trợ upload file lên Supabase Storage vào folder riêng
    const uploadFile = async (file: File | null, filePrefix: string) => {
      if (!file || !(file instanceof Blob) || file.size === 0) return '';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Lấy đuôi file (ví dụ: jpg, png)
      const extension = file.name.split('.').pop() || 'jpg';
      
      // Tạo đường dẫn file: Tên_Folder/Tên_File.ext
      const fileName = `${folderName}/${filePrefix}.${extension}`;
      
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

    const photo_url = await uploadFile(photoFile, 'anh-chan-dung');
    const certificate_url = await uploadFile(certificateFile, 'anh-chung-chi');

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

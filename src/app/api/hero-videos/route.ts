import { NextResponse } from 'next/server';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const DEFAULT_VIDEOS = [
  { id: 'foot-massage', url: '/videos/0807.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 1 },
];

export async function GET() {
  return apiResponse.success(DEFAULT_VIDEOS);
}

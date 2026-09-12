import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Edge revalidation interval (1 hour)

export async function GET() {
  const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJ2ULTMCAvdTERA4I7Sei7vyY';
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  const cacheHeaders = {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
  };

  if (!API_KEY || !PLACE_ID) {
    return NextResponse.json({ rating: 4.8, user_ratings_total: 1243 }, { headers: cacheHeaders });
  }

  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total&key=${API_KEY}`, {
      cache: 'no-store'
    });
    const data = await res.json();

    if (data.result && typeof data.result.user_ratings_total === 'number') {
      return NextResponse.json({
        rating: data.result.rating || 4.8,
        user_ratings_total: data.result.user_ratings_total
      }, { headers: cacheHeaders });
    }

    return NextResponse.json({ rating: 4.8, user_ratings_total: 1243 }, { headers: cacheHeaders });
  } catch (error) {
    console.error('Error fetching Google Reviews:', error);
    return NextResponse.json({ rating: 4.8, user_ratings_total: 1243 }, { headers: cacheHeaders });
  }
}

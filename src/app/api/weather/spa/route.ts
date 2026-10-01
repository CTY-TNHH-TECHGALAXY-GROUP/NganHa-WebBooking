import { getSpaWeather, WEATHER_CACHE_SECONDS } from '@/lib/weather/weather-api';

export async function GET() {
  const weather = await getSpaWeather();
  return Response.json(weather, {
    headers: { 'Cache-Control': weather ? `private, max-age=${WEATHER_CACHE_SECONDS}` : 'no-store' },
  });
}

export type SpaWeatherStatus = 'no_rain' | 'rain_soon' | 'light_rain' | 'rain';

export type SpaWeather = {
  status: SpaWeatherStatus;
  isRaining: boolean;
  rainSoon: boolean;
  temperatureC: number;
  conditionCode: number;
  conditionText: string;
  updatedAt: string;
};

export type WeatherHour = {
  timeEpoch: number;
  chanceOfRain: number;
  precipMm: number;
  conditionCode: number;
};

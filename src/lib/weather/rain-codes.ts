// WeatherAPI condition codes for drizzle, rain, sleet and rain with thunder.
// "Possible" codes (for example 1063) are excluded from current-rain detection.
export const WET_PRECIPITATION_CODES = new Set([
  1150, 1153, 1168, 1171,
  1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201,
  1204, 1207, 1240, 1243, 1246, 1249, 1252, 1273, 1276,
]);

export const MODERATE_OR_HEAVY_PRECIPITATION_CODES = new Set([
  1171, 1186, 1189, 1192, 1195, 1201, 1207, 1243, 1246, 1252, 1276,
]);

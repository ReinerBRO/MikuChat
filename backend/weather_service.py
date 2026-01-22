import requests
from typing import Optional, Dict, Any


WEATHER_CODE_MAP = {
    0: "晴",
    1: "大部晴朗",
    2: "局部多云",
    3: "多云",
    45: "有雾",
    48: "雾凇",
    51: "毛毛雨（小）",
    53: "毛毛雨（中）",
    55: "毛毛雨（大）",
    56: "冻毛毛雨（小）",
    57: "冻毛毛雨（大）",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    66: "冻雨（小）",
    67: "冻雨（大）",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    77: "雪粒",
    80: "阵雨（小）",
    81: "阵雨（中）",
    82: "阵雨（大）",
    85: "阵雪（小）",
    86: "阵雪（大）",
    95: "雷暴",
    96: "雷暴伴小冰雹",
    99: "雷暴伴大冰雹"
}


class WeatherService:
    def __init__(self):
        self.geo_url = "https://geocoding-api.open-meteo.com/v1/search"
        self.forecast_url = "https://api.open-meteo.com/v1/forecast"
        self.session = requests.Session()

    def _weather_text(self, code: Optional[int]) -> str:
        if code is None:
            return "未知"
        return WEATHER_CODE_MAP.get(code, "未知")

    def _geocode_city(self, city: str, lang: str = "zh") -> Optional[Dict[str, Any]]:
        params = {
            "name": city,
            "count": 1,
            "language": lang,
            "format": "json"
        }
        response = self.session.get(self.geo_url, params=params, timeout=10)
        if response.status_code != 200:
            return None
        data = response.json()
        results = data.get("results") or []
        if not results:
            return None
        return results[0]

    def get_weather(
        self,
        city: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        lang: str = "zh"
    ) -> Dict[str, Any]:
        location = None
        if city:
            location = self._geocode_city(city, lang=lang)
            if not location:
                return {"error": "找不到该城市"}
            lat = location.get("latitude")
            lon = location.get("longitude")

        if lat is None or lon is None:
            return {"error": "请提供 city 或 lat/lon"}

        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "timezone": "auto"
        }
        response = self.session.get(self.forecast_url, params=params, timeout=10)
        if response.status_code != 200:
            return {"error": "天气服务暂不可用"}

        data = response.json()
        current = data.get("current") or {}
        daily = data.get("daily") or {}

        daily_time = (daily.get("time") or [None])[0]
        daily_code = (daily.get("weather_code") or [None])[0]
        daily_max = (daily.get("temperature_2m_max") or [None])[0]
        daily_min = (daily.get("temperature_2m_min") or [None])[0]
        daily_pop = (daily.get("precipitation_probability_max") or [None])[0]

        result = {
            "location": {
                "name": location.get("name") if location else None,
                "country": location.get("country") if location else None,
                "admin1": location.get("admin1") if location else None,
                "latitude": lat,
                "longitude": lon,
                "timezone": data.get("timezone")
            },
            "current": {
                "time": current.get("time"),
                "temperature": current.get("temperature_2m"),
                "apparent_temperature": current.get("apparent_temperature"),
                "precipitation": current.get("precipitation"),
                "wind_speed": current.get("wind_speed_10m"),
                "weather_code": current.get("weather_code"),
                "weather_text": self._weather_text(current.get("weather_code"))
            },
            "daily": {
                "date": daily_time,
                "temperature_max": daily_max,
                "temperature_min": daily_min,
                "precipitation_probability_max": daily_pop,
                "weather_code": daily_code,
                "weather_text": self._weather_text(daily_code)
            }
        }

        return result

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import httpx
import os
from typing import Optional

# Load environment variables
load_dotenv()

app = FastAPI(title="GeoSnap API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API endpoints
REST_COUNTRIES_API = "https://restcountries.com/v3.1"
OPENWEATHER_API = "https://api.openweathermap.org/data/2.5/weather"

@app.get("/api/countries")
async def get_countries():
    """Get list of all countries"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{REST_COUNTRIES_API}/all")
        if response.status_code == 200:
            countries = response.json()
            return [{"name": country["name"]["common"], "code": country["cca2"]} for country in countries]
        raise HTTPException(status_code=500, detail="Failed to fetch countries")

@app.get("/api/country/{country_code}")
async def get_country_details(country_code: str):
    """Get detailed information about a specific country"""
    async with httpx.AsyncClient() as client:
        # Get country details
        country_response = await client.get(f"{REST_COUNTRIES_API}/alpha/{country_code}")
        if country_response.status_code != 200:
            raise HTTPException(status_code=404, detail="Country not found")
        
        country_data = country_response.json()[0]
        
        # Get weather data for capital
        capital = country_data.get("capital", [None])[0]
        if capital:
            weather_response = await client.get(
                OPENWEATHER_API,
                params={
                    "q": capital,
                    "appid": os.getenv("OPENWEATHER_API_KEY"),
                    "units": "metric"
                }
            )
            weather_data = weather_response.json() if weather_response.status_code == 200 else None
        else:
            weather_data = None

        return {
            "name": country_data["name"]["common"],
            "flag": country_data["flags"]["png"],
            "capital": capital,
            "population": country_data["population"],
            "timezone": country_data["timezones"],
            "currency": list(country_data.get("currencies", {}).values())[0] if country_data.get("currencies") else None,
            "coordinates": country_data["latlng"],
            "weather": weather_data
        }

@app.get("/api/search")
async def search_countries(query: str):
    """Search countries by name"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{REST_COUNTRIES_API}/name/{query}")
        if response.status_code == 200:
            countries = response.json()
            return [{"name": country["name"]["common"], "code": country["cca2"]} for country in countries]
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
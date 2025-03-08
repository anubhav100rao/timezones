from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from zoneinfo import ZoneInfo
from tzlocal import get_localzone
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Timezone Conversion API")

# Enable CORS (Cross-Origin Resource Sharing) to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Define available time zones and pre-create ZoneInfo objects
AVAILABLE_TIMEZONES = {
    "America/New_York": ZoneInfo("America/New_York"),
    "America/Los_Angeles": ZoneInfo("America/Los_Angeles"),
    "Asia/Tokyo": ZoneInfo("Asia/Tokyo"),
    "Asia/Dubai": ZoneInfo("Asia/Dubai"),
    "Asia/Kolkata": ZoneInfo("Asia/Kolkata"),
    "Europe/London": ZoneInfo("Europe/London"),
    "Europe/Paris": ZoneInfo("Europe/Paris"),
}


@app.get("/current_time")
async def get_current_time():
    # Get the local time zone using tzlocal
    local_tz = get_localzone()

    # Get the current time in the local time zone
    now = datetime.now(local_tz)
    date = now.strftime("%Y-%m-%d")
    time = now.strftime("%I:%M:%S %p")
    return {
        # IANA time zone string, e.g., "America/New_York"
        "timezone": str(local_tz),
        "current_time": f"{date} {time}",
    }


@app.get("/timezones")
async def list_timezones():
    """
    Returns a list of available time zones along with the current time in each.
    """
    timezones_with_time = [
        {"timezone": tz, "current_time": datetime.now(zone).isoformat()}
        for tz, zone in AVAILABLE_TIMEZONES.items()
    ]
    return {"timezones": timezones_with_time}


class ConvertTimeRequest(BaseModel):
    source_timezone: str = Field(..., example="America/New_York")
    target_timezone: str = Field(..., example="Asia/Kolkata")
    # ISO format: e.g. "2025-03-08T14:30:00"
    time: str = Field(..., example="2025-03-08T14:30:00")


class ConvertTimeResponse(BaseModel):
    source_time: str
    source_timezone: str
    target_time: str
    target_timezone: str


@app.post("/convert-time", response_model=ConvertTimeResponse)
async def convert_time(payload: ConvertTimeRequest):
    """
    Convert a time from one timezone to another.
    """
    # Validate source and target time zones against the dictionary keys
    if payload.source_timezone not in AVAILABLE_TIMEZONES:
        raise HTTPException(
            status_code=400, detail="Source timezone is not supported.")
    if payload.target_timezone not in AVAILABLE_TIMEZONES:
        raise HTTPException(
            status_code=400, detail="Target timezone is not supported.")

    try:
        # Parse the provided time string (assumed to be in ISO format)
        naive_dt = datetime.fromisoformat(payload.time)
    except Exception:
        raise HTTPException(
            status_code=400, detail="Invalid time format. Please use ISO format.")

    src_zone = AVAILABLE_TIMEZONES[payload.source_timezone]
    target_zone = AVAILABLE_TIMEZONES[payload.target_timezone]

    # Attach the source timezone to the naive datetime object
    src_time = naive_dt.replace(tzinfo=src_zone)
    # Convert the source time to the target timezone
    target_time = src_time.astimezone(target_zone)

    return ConvertTimeResponse(
        source_time=src_time.isoformat(),
        source_timezone=payload.source_timezone,
        target_time=target_time.isoformat(),
        target_timezone=payload.target_timezone,
    )

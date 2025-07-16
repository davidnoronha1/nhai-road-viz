from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, MetaData, Table, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import math
import os

DATABASE_URL = "sqlite+aiosqlite:///data.db"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

metadata = MetaData()
Base = declarative_base()


def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in kilometers
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c * 1000  # meters


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(metadata.reflect)


@app.get("/roads")
async def get_all_roads():
    async with async_session() as session:
        road_data = Table("road_data", metadata, autoload_with=engine.sync_engine)
        stmt = select(road_data)
        result = await session.execute(stmt)
        return [dict(row._mapping) for row in result.fetchall()]


@app.get("/roads/by-location")
async def get_road_by_location(
    lat: float = Query(..., description="Latitude of the clicked point"),
    lng: float = Query(..., description="Longitude of the clicked point"),
    radius: float = Query(100, description="Search radius in meters"),
):
    async with async_session() as session:
        road_data = Table("road_data", metadata, autoload_with=engine.sync_engine)
        stmt = select(road_data)
        result = await session.execute(stmt)
        rows = result.fetchall()

        closest_segment = None
        min_distance = float("inf")

        for row in rows:
            row_dict = dict(row._mapping)

            coordinates_to_check = [
                (row_dict.get("l1_start_latitude"), row_dict.get("l1_start_longitude")),
                (row_dict.get("l1_end_latitude"), row_dict.get("l1_end_longitude")),
                (row_dict.get("l2_start_latitude"), row_dict.get("l2_start_longitude")),
                (row_dict.get("l2_end_latitude"), row_dict.get("l2_end_longitude")),
                (row_dict.get("r1_start_latitude"), row_dict.get("r1_start_longitude")),
                (row_dict.get("r1_end_latitude"), row_dict.get("r1_end_longitude")),
                (row_dict.get("r2_start_latitude"), row_dict.get("r2_start_longitude")),
                (row_dict.get("r2_end_latitude"), row_dict.get("r2_end_longitude")),
            ]

            for coord_lat, coord_lng in coordinates_to_check:
                if coord_lat is not None and coord_lng is not None:
                    distance = calculate_distance(lat, lng, coord_lat, coord_lng)
                    if distance < min_distance:
                        min_distance = distance
                        closest_segment = row_dict

        if closest_segment and min_distance <= radius:
            return {"segment": closest_segment, "distance": min_distance}
        else:
            return {"segment": None, "distance": None, "message": f"No road segment found within {radius} meters"}


@app.get("/videos")
async def list_all_videos():
    """Returns a list of all videos with their IDs and relative file paths."""
    async with async_session() as session:
        videos = Table("videos", metadata, autoload_with=engine.sync_engine)
        stmt = select(videos)
        result = await session.execute(stmt)
        return [dict(row._mapping) for row in result.fetchall()]


@app.get("/videos/{video_id}")
async def get_video_and_coordinates(video_id: int):
    """Returns metadata and all associated GPS coordinates for a specific video."""
    async with async_session() as session:
        videos = Table("videos", metadata, autoload_with=engine.sync_engine)
        frames = Table("frames", metadata, autoload_with=engine.sync_engine)

        video_stmt = select(videos).where(videos.c.id == video_id)
        video_result = await session.execute(video_stmt)
        video_row = video_result.fetchone()

        if not video_row:
            raise HTTPException(status_code=404, detail="Video not found")

        video_data = dict(video_row._mapping)
        video_path = video_data["filename"]

        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video file not found on disk")

        frames_stmt = select(frames).where(frames.c.video_id == video_id).order_by(frames.c.frame_number)
        frame_result = await session.execute(frames_stmt)
        frame_data = [dict(row._mapping) for row in frame_result.fetchall()]

        return {"video_path": video_path, "coordinates": frame_data}


@app.get("/videos/{video_id}/file")
async def download_video_file(video_id: int):
    """Serves the video file directly for download or playback."""
    async with async_session() as session:
        videos = Table("videos", metadata, autoload_with=engine.sync_engine)

        stmt = select(videos).where(videos.c.id == video_id)
        result = await session.execute(stmt)
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Video not found")

        video_path = row._mapping["filename"]
        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="File does not exist on disk")

        return FileResponse(video_path, media_type="video/mp4", filename=os.path.basename(video_path))
"""
Events Router: /api/events
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user, require_manager
from models import Event, SensorReading, User

router = APIRouter()


class EventCreate(BaseModel):
    name: str
    venue: str
    capacity: int = 50000
    sport_type: str = "Football"
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    start_time: Optional[datetime] = None
    description: Optional[str] = None


def fmt_event(e: Event):
    return {
        "id": e.id,
        "name": e.name,
        "venue": e.venue,
        "capacity": e.capacity,
        "current_attendance": e.current_attendance,
        "status": e.status,
        "sport_type": e.sport_type,
        "home_team": e.home_team,
        "away_team": e.away_team,
        "home_score": e.home_score,
        "away_score": e.away_score,
        "start_time": e.start_time.isoformat() if e.start_time else None,
        "end_time": e.end_time.isoformat() if e.end_time else None,
        "description": e.description,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


@router.get("")
async def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = db.query(Event).order_by(Event.start_time.desc()).all()
    return [fmt_event(e) for e in events]


@router.post("")
async def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    event = Event(**payload.dict())
    db.add(event)
    db.commit()
    db.refresh(event)
    return fmt_event(event)


@router.get("/{event_id}")
async def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return fmt_event(event)


@router.get("/{event_id}/heatmap")
async def get_heatmap(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return latest density per zone for heatmap rendering."""
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.event_id == event_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(200)
        .all()
    )
    # Latest reading per zone
    seen = {}
    for r in readings:
        if r.zone not in seen:
            seen[r.zone] = {
                "zone": r.zone,
                "density": r.density,
                "queue_length": r.queue_length,
                "wait_time_minutes": r.wait_time_minutes,
                "timestamp": r.timestamp.isoformat(),
            }
    return list(seen.values())


@router.patch("/{event_id}/status")
async def update_event_status(
    event_id: int,
    status: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.status = status
    db.commit()
    return {"message": "Status updated", "status": status}

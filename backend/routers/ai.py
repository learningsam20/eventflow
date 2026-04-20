"""
AI Router: /api/ai
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user, require_manager
from models import User, ChatMessage
from services.gemini_service import chat_concierge, ops_command, analyze_incident, generate_event_narrative

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    event_id: Optional[int] = None
    history: Optional[List[dict]] = []
    sensor_context: Optional[dict] = None


class OpsRequest(BaseModel):
    goal: str
    sensor_state: Optional[dict] = None
    event_id: Optional[int] = None


class IncidentRequest(BaseModel):
    description: str
    zone: Optional[str] = None
    zone_data: Optional[dict] = None


class NarrativeRequest(BaseModel):
    event_id: int


@router.post("/chat")
async def ai_chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Gather User Context for Agentic Grounding
    from models import Ticket, Order, Event
    tickets = db.query(Ticket).filter(Ticket.user_id == current_user.id).all()
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).limit(3).all()
    
    ticket_list = []
    for t in tickets:
        ev = db.query(Event).filter(Event.id == t.event_id).first()
        ticket_list.append(f"{ev.name if ev else 'Match'} (Status: {t.status}, Seat: {t.seat_info})")
    
    order_list = []
    for o in orders:
        order_list.append(f"Order {o.qr_code} (Status: {o.status})")
    
    user_context = f"User: {current_user.full_name or current_user.username}. "
    user_context += f"Tickets: {'; '.join(ticket_list) if ticket_list else 'None'}. "
    user_context += f"Recent Orders: {', '.join(order_list) if order_list else 'None'}."

    result = await chat_concierge(
        message=payload.message,
        history=payload.history or [],
        sensor_context=payload.sensor_context,
        user_context=user_context
    )

    # Persist messages
    user_msg = ChatMessage(
        user_id=current_user.id,
        event_id=payload.event_id,
        role="user",
        content=payload.message,
    )
    db.add(user_msg)

    ai_msg = ChatMessage(
        user_id=current_user.id,
        event_id=payload.event_id,
        role="assistant",
        content=result["response"],
        sources=result.get("sources"),
    )
    db.add(ai_msg)
    db.commit()

    return result


@router.post("/ops")
async def ai_ops(
    payload: OpsRequest,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """Manager ops AI assistant."""
    result = await ops_command(
        goal=payload.goal,
        sensor_state=payload.sensor_state,
    )
    return result


@router.post("/analyze-incident")
async def ai_analyze_incident(
    payload: IncidentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze and triage an incident."""
    result = await analyze_incident(
        description=payload.description,
        zone_data=payload.zone_data,
    )
    return result


@router.post("/narrative")
async def ai_narrative(
    payload: NarrativeRequest,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """Generate AI event narrative report."""
    from models import Event, AnalyticsSnapshot
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    latest_snap = (
        db.query(AnalyticsSnapshot)
        .filter(AnalyticsSnapshot.event_id == payload.event_id)
        .order_by(AnalyticsSnapshot.taken_at.desc())
        .first()
    )
    analytics = {}
    if latest_snap:
        analytics = {
            "avg_queue_time": latest_snap.avg_queue_time,
            "nps_score": latest_snap.nps_score,
            "incident_count": latest_snap.incident_count,
            "orders_fulfilled": latest_snap.orders_fulfilled,
        }

    event_data = {
        "name": event.name,
        "venue": event.venue,
        "home_team": event.home_team,
        "away_team": event.away_team,
        "home_score": event.home_score,
        "away_score": event.away_score,
    }

    # Return stored narrative if it's a past event and we already have it
    if event.status != "live" and event.ai_narrative:
        return {"narrative": event.ai_narrative}

    narrative = await generate_event_narrative(event_data, analytics)
    
    # Store narrative if event is not live
    if event.status != "live":
        event.ai_narrative = narrative
        db.commit()
        
    return {"narrative": narrative}


@router.get("/chat-history")
async def get_chat_history(
    event_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get chat history for current user."""
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if event_id:
        query = query.filter(ChatMessage.event_id == event_id)
    messages = query.order_by(ChatMessage.timestamp.asc()).limit(50).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "sources": m.sources,
            "timestamp": m.timestamp.isoformat(),
        }
        for m in messages
    ]

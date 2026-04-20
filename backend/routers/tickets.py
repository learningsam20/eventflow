"""
Tickets Router: /api/tickets
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from auth import get_current_user
from models import Ticket, Event, User

router = APIRouter()


@router.get("/my")
async def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch current user's tickets (past and upcoming)."""
    tickets = (
        db.query(Ticket)
        .filter(Ticket.user_id == current_user.id)
        .order_by(Ticket.status.asc(), Ticket.created_at.desc())
        .all()
    )
    
    result = []
    for t in tickets:
        event = db.query(Event).filter(Event.id == t.event_id).first()
        result.append({
            "id": t.id,
            "event_id": t.event_id,
            "event_name": event.name if event else "Unknown Event",
            "event_date": event.start_time.strftime("%d %b %Y") if event else "N/A",
            "venue": event.venue if event else "N/A",
            "ticket_code": t.ticket_code,
            "seat_info": t.seat_info,
            "price_paid": t.price_paid,
            "payment_method": t.payment_method,
            "payment_status": t.payment_status,
            "ai_summary": t.ai_summary,
            "status": t.status,
            "sport_type": event.sport_type if event else "Football",
        })
    
    return result


@router.get("/{ticket_id}")
async def get_ticket_details(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch specific ticket details."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id, Ticket.user_id == current_user.id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    event = db.query(Event).filter(Event.id == ticket.event_id).first()
    return {
        "id": ticket.id,
        "event_name": event.name if event else "Unknown Event",
        "ticket_code": ticket.ticket_code,
        "seat_info": ticket.seat_info,
        "ai_summary": ticket.ai_summary,
        "status": ticket.status,
    }

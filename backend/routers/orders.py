"""
Orders Router: /api/orders
"""
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user, require_manager
from models import User, Order, Event

router = APIRouter()

MENU = [
    {"id": 1, "name": "Hot Dog", "price": 6.50, "category": "food", "emoji": "🌭"},
    {"id": 2, "name": "Craft Beer", "price": 8.00, "category": "drinks", "emoji": "🍺"},
    {"id": 3, "name": "Nachos", "price": 9.00, "category": "food", "emoji": "🧀"},
    {"id": 4, "name": "Soft Drink", "price": 4.00, "category": "drinks", "emoji": "🥤"},
    {"id": 5, "name": "Burger", "price": 12.00, "category": "food", "emoji": "🍔"},
    {"id": 6, "name": "Popcorn", "price": 5.00, "category": "food", "emoji": "🍿"},
    {"id": 7, "name": "Coffee", "price": 4.50, "category": "drinks", "emoji": "☕"},
    {"id": 8, "name": "Chips", "price": 3.50, "category": "food", "emoji": "🍟"},
    {"id": 9, "name": "Ice Cream", "price": 5.50, "category": "dessert", "emoji": "🍦"},
    {"id": 10, "name": "Water", "price": 2.50, "category": "drinks", "emoji": "💧"},
]


class OrderItem(BaseModel):
    id: int
    qty: int = 1


class OrderCreate(BaseModel):
    event_id: int
    items: List[OrderItem]
    pickup_zone: Optional[str] = "Concourse A"


def fmt_order(o: Order):
    return {
        "id": o.id,
        "user_id": o.user_id,
        "event_id": o.event_id,
        "items": o.items,
        "total_amount": o.total_amount,
        "status": o.status,
        "pickup_zone": o.pickup_zone,
        "pickup_time": o.pickup_time.isoformat() if o.pickup_time else None,
        "qr_code": o.qr_code,
        "created_at": o.created_at.isoformat() if o.created_at else None,
    }


@router.get("/menu")
async def get_menu():
    return MENU


@router.post("")
async def place_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    menu_map = {item["id"]: item for item in MENU}
    order_items = []
    total = 0.0
    for item in payload.items:
        if item.id not in menu_map:
            raise HTTPException(status_code=400, detail=f"Item {item.id} not found")
        menu_item = menu_map[item.id]
        order_items.append({
            "id": item.id,
            "name": menu_item["name"],
            "qty": item.qty,
            "price": menu_item["price"],
            "emoji": menu_item["emoji"],
        })
        total += menu_item["price"] * item.qty

    qr = f"EF-{uuid.uuid4().hex[:8].upper()}"
    pickup_time = datetime.utcnow() + timedelta(minutes=12)

    order = Order(
        user_id=current_user.id,
        event_id=payload.event_id,
        items=order_items,
        total_amount=round(total, 2),
        status="pending",
        pickup_zone=payload.pickup_zone,
        pickup_time=pickup_time,
        qr_code=qr,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return fmt_order(order)


@router.get("/my")
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [fmt_order(o) for o in orders]


@router.get("")
async def get_all_orders(
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(100).all()
    return [fmt_order(o) for o in orders]


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    return {"message": "Order updated", "status": status}

"""
EventFlow Seed Script
Creates default users, events, and demo data.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta, timezone
import random
from database import SessionLocal, init_db
from models import User, Event, SensorReading, Incident, AnalyticsSnapshot, Order, Ticket
from auth import get_password_hash


ZONES = [
    "North Stand", "South Stand", "East Wing", "West Wing",
    "Main Gate", "VIP Entrance", "Concourse A", "Concourse B",
    "Food Court 1", "Food Court 2", "Parking Zone A", "Parking Zone B",
    "Medical Bay", "Staff Area", "Press Box", "Emergency Exit"
]


def seed_users(db):
    users = [
        {
            "username": "event_manager",
            "email": "manager@eventflow.ai",
            "password": "test@123",
            "role": "event_manager",
            "full_name": "Alex Thompson",
            "avatar_color": "#6c63ff",
        },
        {
            "username": "event_user",
            "email": "fan@eventflow.ai",
            "password": "test@123",
            "role": "event_user",
            "full_name": "Jordan Smith",
            "avatar_color": "#00d4ff",
        },
    ]
    created = []
    for u in users:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"],
                full_name=u["full_name"],
                avatar_color=u["avatar_color"],
            )
            db.add(user)
            created.append(u["username"])
    db.commit()
    print(f"[seed] Users seeded: {created if created else 'already exist'}")


def seed_events(db):
    events_data = [
        {
            "name": "Champions League Final - EventFlow Stadium",
            "venue": "EventFlow Arena, London",
            "capacity": 75000,
            "current_attendance": 68200,
            "status": "live",
            "sport_type": "Football",
            "home_team": "Manchester City",
            "away_team": "Real Madrid",
            "home_score": 2,
            "away_score": 1,
            "start_time": datetime.now(timezone.utc) - timedelta(hours=1),
            "description": "Live: The showdown of the decade. Capacity crowd.",
        },
        {
            "name": "Premier League - Derby Weekend",
            "venue": "EventFlow Arena, London",
            "capacity": 75000,
            "current_attendance": 0,
            "status": "upcoming",
            "sport_type": "Football",
            "home_team": "Arsenal",
            "away_team": "Chelsea",
            "home_score": 0,
            "away_score": 0,
            "start_time": datetime.now(timezone.utc) + timedelta(days=3),
            "description": "The London Derby. Tickets nearly sold out.",
        },
        {
            "name": "FA Cup Quarterfinal",
            "venue": "EventFlow Arena, London",
            "capacity": 75000,
            "current_attendance": 71000,
            "status": "ended",
            "sport_type": "Football",
            "home_team": "Liverpool",
            "away_team": "Tottenham",
            "home_score": 3,
            "away_score": 2,
            "start_time": datetime.now(timezone.utc) - timedelta(days=7),
            "end_time": datetime.now(timezone.utc) - timedelta(days=7, hours=-2),
            "description": "A classic 5-goal thriller.",
        },
    ]
    created = []
    for e in events_data:
        existing = db.query(Event).filter(Event.name == e["name"]).first()
        if not existing:
            event = Event(**e)
            db.add(event)
            created.append(e["name"])
    db.commit()
    print(f"[seed] Events seeded: {len(created)} new")
    return db.query(Event).all()


def seed_sensor_readings(db, events):
    for event in events:
        for zone in ZONES:
            for i in range(10):  # 10 historical readings per zone
                ts = datetime.now(timezone.utc) - timedelta(minutes=i * 5)
                density = random.uniform(0.1, 0.95)
                reading = SensorReading(
                    event_id=event.id,
                    zone=zone,
                    density=round(density, 2),
                    queue_length=int(density * 200),
                    wait_time_minutes=round(density * 15, 1),
                    temperature=round(random.uniform(18, 28), 1),
                    noise_level=round(random.uniform(65, 95), 1),
                    timestamp=ts,
                )
                db.add(reading)
    db.commit()
    print("[seed] Sensor readings seeded")


def seed_incidents(db, events):
    incident_templates = [
        ("North Stand", "high", "crowd_density", "Overcrowding detected. Density at 95%. Recommend rerouting fans via East Concourse."),
        ("Main Gate", "medium", "queue_overflow", "Gate 3 queue exceeding 200 persons. Suggested: open auxiliary gate 3B."),
        ("Food Court 1", "low", "wait_time", "Average wait time at Food Court 1 is 18 minutes. Recommend opening counter 4."),
        ("Parking Zone A", "medium", "traffic_flow", "Exit traffic backing up. Suggest staggered exit messaging to North Stand."),
        ("Medical Bay", "critical", "medical", "Medical incident reported near Section 14. Response team dispatched."),
    ]
    for event in events:
        for zone, sev, itype, desc in incident_templates:
            existing = db.query(Incident).filter(
                Incident.event_id == event.id, Incident.zone == zone
            ).first()
            if not existing:
                resolved = random.choice([True, False])
                incident = Incident(
                    event_id=event.id,
                    zone=zone,
                    severity=sev,
                    incident_type=itype,
                    description=desc,
                    resolved=resolved,
                    resolved_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 30)) if resolved else None,
                    response_time_minutes=round(random.uniform(2, 15), 1) if resolved else None,
                    ai_suggestion=f"AI recommends: {desc[:80]}...",
                    timestamp=datetime.now(timezone.utc) - timedelta(minutes=random.randint(10, 120)),
                )
                db.add(incident)
    db.commit()
    print("[seed] Incidents seeded")


def seed_analytics(db, events):
    for event in events:
        for i in range(5):
            snap = AnalyticsSnapshot(
                event_id=event.id,
                avg_queue_time=round(random.uniform(5, 18), 1),
                peak_density=round(random.uniform(0.6, 0.98), 2),
                throughput_per_minute=round(random.uniform(150, 500), 0),
                nps_score=round(random.uniform(65, 92), 1),
                incident_count=random.randint(2, 12),
                orders_fulfilled=random.randint(500, 3000),
                zone_data={zone: round(random.uniform(0.2, 0.95), 2) for zone in ZONES},
                taken_at=datetime.now(timezone.utc) - timedelta(hours=i * 2),
            )
            db.add(snap)
    db.commit()
    print("[seed] Analytics snapshots seeded")


def seed_orders(db, events):
    menu_items = [
        {"name": "Hot Dog", "price": 6.50},
        {"name": "Craft Beer", "price": 8.00},
        {"name": "Nachos", "price": 9.00},
        {"name": "Soft Drink", "price": 4.00},
        {"name": "Burger", "price": 12.00},
        {"name": "Popcorn", "price": 5.00},
    ]
    user = db.query(User).filter(User.role == "event_user").first()
    if user and events:
        event = events[0]
        for i in range(3):
            items = random.sample(menu_items, k=random.randint(1, 3))
            total = sum(item["price"] for item in items)
            order = Order(
                user_id=user.id,
                event_id=event.id,
                items=[{**item, "qty": 1} for item in items],
                total_amount=round(total, 2),
                status=random.choice(["pending", "preparing", "ready", "collected"]),
                pickup_zone=random.choice(["Concourse A", "Concourse B", "Food Court 1"]),
                pickup_time=datetime.now(timezone.utc) + timedelta(minutes=random.randint(10, 30)),
                qr_code=f"EF-ORDER-{1000 + i:04d}",
            )
            db.add(order)
    db.commit()
    print("[seed] Orders seeded")


def seed_tickets(db, events):
    user = db.query(User).filter(User.username == "event_user").first()
    if not user:
        return
        
    for event in events:
        existing = db.query(Ticket).filter(Ticket.user_id == user.id, Ticket.event_id == event.id).first()
        if not existing:
            status = event.status
            price = random.choice([45.0, 65.0, 95.0, 125.0, 250.0])
            seat = f"Block {random.choice(['A','B','C','D'])}, Row {random.randint(1,25)}, Seat {random.randint(1,40)}"
            code = f"EF-{random.randint(100000, 999999)}"
            
            summary = ""
            if status == "ended":
                summary = f"What a match! You witnessed a thrilling game where {event.home_team} took on {event.away_team}. With a final score of {event.home_score}-{event.away_score}, the atmosphere was electric. AI Operations ensured a smooth exit within 22 minutes for your section."
            elif status == "live":
                summary = f"The match is currently in progress! Enjoy the action at {event.venue}. Your position in {seat} offers a great view of the pitch. AI Concierge is ready to help you find the shortest queues during halftime."
            else:
                summary = f"Get ready for {event.home_team} vs {event.away_team}! Your digital ticket is confirmed for {event.start_time.strftime('%d %b %Y')}. We recommend arriving 90 minutes early to enjoy the pre-match Fan Zone experience."

            ticket = Ticket(
                user_id=user.id,
                event_id=event.id,
                ticket_code=code,
                seat_info=seat,
                price_paid=price,
                payment_method=random.choice(["Apple Pay", "Visa Card", "PayPal"]),
                ai_summary=summary,
                status=status
            )
            db.add(ticket)
    db.commit()
    print("[seed] Tickets seeded for event_user")


def main():
    print("[seed] Seeding EventFlow database...")
    init_db()
    db = SessionLocal()
    try:
        seed_users(db)
        events = seed_events(db)
        seed_sensor_readings(db, events)
        seed_incidents(db, events)
        seed_analytics(db, events)
        seed_orders(db, events)
        seed_tickets(db, events)
        print("[seed] Seeding complete!")
        print("   event_manager / test@123  -> Manager access")
        print("   event_user    / test@123  -> Fan access")
    finally:
        db.close()


if __name__ == "__main__":
    main()

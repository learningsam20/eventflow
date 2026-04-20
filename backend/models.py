"""
EventFlow SQLAlchemy ORM Models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="event_user")  # event_manager | event_user
    full_name = Column(String(100), nullable=True)
    avatar_color = Column(String(10), default="#6c63ff")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")
    tickets = relationship("Ticket", back_populates="user")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    venue = Column(String(200), nullable=False)
    capacity = Column(Integer, default=50000)
    current_attendance = Column(Integer, default=0)
    status = Column(String(20), default="upcoming")  # upcoming | live | ended
    sport_type = Column(String(50), default="Football")
    home_team = Column(String(100), nullable=True)
    away_team = Column(String(100), nullable=True)
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    ai_narrative = Column(Text, nullable=True)  # Persistent narrative for past events
    created_at = Column(DateTime, default=datetime.utcnow)

    sensor_readings = relationship("SensorReading", back_populates="event")
    incidents = relationship("Incident", back_populates="event")
    orders = relationship("Order", back_populates="event")
    analytics = relationship("AnalyticsSnapshot", back_populates="event")
    tickets = relationship("Ticket", back_populates="event")
    media = relationship("EventMedia", back_populates="event")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    zone = Column(String(50), nullable=False)
    density = Column(Float, default=0.0)  # 0.0 to 1.0
    queue_length = Column(Integer, default=0)
    wait_time_minutes = Column(Float, default=0.0)
    temperature = Column(Float, default=22.0)
    noise_level = Column(Float, default=60.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="sensor_readings")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    items = Column(JSON, nullable=False)  # [{name, qty, price}, ...]
    total_amount = Column(Float, default=0.0)
    status = Column(String(30), default="pending")  # pending | preparing | ready | collected
    pickup_zone = Column(String(50), nullable=True)
    pickup_time = Column(DateTime, nullable=True)
    qr_code = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    event = relationship("Event", back_populates="orders")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    zone = Column(String(50), nullable=False)
    severity = Column(String(20), default="low")  # low | medium | high | critical
    incident_type = Column(String(50), default="crowd_density")
    description = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    response_time_minutes = Column(Float, nullable=True)
    ai_suggestion = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="incidents")


class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    avg_queue_time = Column(Float, default=0.0)
    peak_density = Column(Float, default=0.0)
    throughput_per_minute = Column(Float, default=0.0)
    nps_score = Column(Float, default=0.0)
    incident_count = Column(Integer, default=0)
    orders_fulfilled = Column(Integer, default=0)
    zone_data = Column(JSON, nullable=True)  # zone-level breakdown
    taken_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="analytics")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    ticket_code = Column(String(50), unique=True, index=True)  # EF-XXXXXX
    seat_info = Column(String(100), nullable=True)  # Block B, Row 14, Seat 22
    price_paid = Column(Float, default=0.0)
    payment_method = Column(String(50), default="Credit Card")
    payment_status = Column(String(20), default="completed")  # completed | pending
    ai_summary = Column(Text, nullable=True)  # Personalized event summary
    status = Column(String(20), default="upcoming")  # upcoming | past
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tickets")
    event = relationship("Event", back_populates="tickets")


class EventMedia(Base):
    __tablename__ = "event_media"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    image_path = Column(String(255), nullable=False)
    media_type = Column(String(50), default="fan_photo")  # fan_photo, ops_report, surveillance
    caption = Column(String(255), nullable=True)
    ai_description = Column(Text, nullable=True)  # Populated by Gemini
    zone = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="media")
    user = relationship("User")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    role = Column(String(20), nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)  # RAG sources
    timestamp = Column(DateTime, default=datetime.utcnow)

"""
EventFlow Database Configuration
Supports SQLite (dev) and Firebase Firestore (prod) via USE_FIREBASE env var.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db/eventflow.db")
USE_FIREBASE = os.getenv("USE_FIREBASE", "false").lower() == "true"

# SQLAlchemy Configuration for SQL (SQLite or Cloud SQL)
# For Cloud Run + Cloud SQL, the URL often looks like:
# postgresql+pg8000://<user>:<pass>@/<dbname>?unix_sock=/cloudsql/<project>:<region>:<instance>/.s.PGSQL.5432
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Firebase Firestore Configuration (Optional)
firestore_db = None
if USE_FIREBASE:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Look for credentials at path in FIREBASE_CREDENTIALS or use default
        cred_path = os.getenv("FIREBASE_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # Attempt default initialization (works in GCloud if service account is set)
            firebase_admin.initialize_app()
            
        firestore_db = firestore.client()
        print("[EventFlow] Firebase Firestore initialized successfully.")
    except Exception as e:
        print(f"[EventFlow] Failed to initialize Firebase: {e}")


def get_db():
    """FastAPI dependency: yields a database session (SQLAlchemy)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_firestore():
    """Returns the Firestore client if enabled."""
    return firestore_db


def init_db():
    """Create all tables on startup (SQL only)."""
    from models import Base  # noqa: F401
    if "sqlite" in DATABASE_URL or "postgresql" in DATABASE_URL or "mysql" in DATABASE_URL:
        Base.metadata.create_all(bind=engine)

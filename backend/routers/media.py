"""
Media Router: /api/media
Handles image uploads and multimodal AI analysis.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid
import shutil
from datetime import datetime

from database import get_db
from auth import get_current_user
from models import EventMedia, User
from services.gemini_service import analyze_image_content

router = APIRouter()

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_media(
    event_id: int = Form(...),
    zone: str = Form(None),
    caption: str = Form(None),
    media_type: str = Form("fan_photo"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload an image, save it, and trigger Gemini analysis."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run AI Analysis (Multimodal)
    ai_desc = "AI analysis pending..."
    try:
        # Read file for Gemini
        with open(file_path, "rb") as f:
            image_bytes = f.read()
            ai_desc = await analyze_image_content(image_bytes, media_type)
    except Exception as e:
        print(f"Media AI Analysis Error: {e}")
        ai_desc = "Could not analyze image content."

    # Save to DB
    new_media = EventMedia(
        event_id=event_id,
        user_id=current_user.id,
        image_path=f"/static/uploads/{file_name}",
        media_type=media_type,
        caption=caption,
        ai_description=ai_desc,
        zone=zone,
        timestamp=datetime.utcnow()
    )
    db.add(new_media)
    db.commit()
    db.refresh(new_media)

    return {
        "id": new_media.id,
        "image_path": new_media.image_path,
        "ai_description": new_media.ai_description,
        "status": "success"
    }

@router.get("/{event_id}")
async def get_event_media(
    event_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve all media for a specific event."""
    media = db.query(EventMedia).filter(EventMedia.event_id == event_id).order_by(EventMedia.timestamp.desc()).all()
    return media

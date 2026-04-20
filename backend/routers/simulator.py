"""
Simulator Router: /api/simulator + WebSocket /ws/simulator
"""
import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from auth import get_current_user
from models import User
from services.simulator_engine import sim_engine, SCENARIOS

router = APIRouter()


class SimulatorStartRequest(BaseModel):
    scenario: str = "entry_surge"
    speed: int = 1  # 1-10


@router.get("/scenarios")
async def list_scenarios():
    return [
        {
            "key": k,
            "name": v["name"],
            "description": v["description"],
            "icon": v["icon"],
            "duration_ticks": v["duration_ticks"],
        }
        for k, v in SCENARIOS.items()
    ]


@router.post("/start")
async def start_simulator(
    payload: SimulatorStartRequest,
    current_user: User = Depends(get_current_user),
):
    if payload.scenario not in SCENARIOS:
        raise HTTPException(status_code=400, detail=f"Unknown scenario: {payload.scenario}")
    sim_engine.start(payload.scenario, payload.speed)
    return {
        "status": "started",
        "scenario": payload.scenario,
        "speed": payload.speed,
    }


@router.post("/stop")
async def stop_simulator(current_user: User = Depends(get_current_user)):
    sim_engine.stop()
    return {"status": "stopped"}


@router.get("/status")
async def get_status(current_user: User = Depends(get_current_user)):
    return {
        "running": sim_engine.running,
        "scenario": sim_engine.scenario_key,
        "tick": sim_engine.tick,
        "speed": sim_engine.speed,
    }


@router.get("/frame")
async def get_single_frame(current_user: User = Depends(get_current_user)):
    """Get a single snapshot frame without starting the stream."""
    if not sim_engine.running:
        # Return static demo frame
        sim_engine.start("halftime_rush", 1)
        frame = sim_engine.get_frame()
        sim_engine.stop()
        return frame
    return sim_engine.get_frame()


@router.websocket("/ws")
async def websocket_simulator(websocket: WebSocket):
    """WebSocket endpoint streaming live simulator frames."""
    await websocket.accept()
    try:
        while True:
            if sim_engine.running:
                frame = sim_engine.get_frame()
                await websocket.send_text(json.dumps(frame))
                interval = 1.0 / max(1, sim_engine.speed)
                await asyncio.sleep(interval)
            else:
                # Send idle ping
                await websocket.send_text(json.dumps({"status": "idle", "running": False}))
                await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass

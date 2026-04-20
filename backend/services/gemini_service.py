"""
Gemini AI Service - EventFlow
Handles concierge chat, ops analysis, and creative generation.
"""
import os
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Ensure .env is loaded correctly regardless of whether we run from root or backend/
env_paths = [".env", "backend/.env", "../.env"]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

def get_config(key, default=""):
    return os.getenv(key, default)

# Venue knowledge base for RAG-style grounding
VENUE_KNOWLEDGE = """
# EventFlow Arena - Venue Guide

## Layout
- **North Stand**: Sections 1-20, capacity 18,000. Premium seated area.
- **South Stand**: Sections 21-40, family zone, capacity 16,000.
- **East Wing**: Sections 41-60, away supporters, capacity 12,000.
- **West Wing**: Sections 61-80, corporate boxes, capacity 10,000.

## Gates & Entrances
- **Main Gate**: Primary entry, 8 turnstiles. Opens 2 hours pre-match.
- **VIP Entrance**: Priority lane access, 2 turnstiles, security fast-track.
- **Emergency Exit**: 4 fire exits, staff-controlled, evacuation use only.

## Concessions
- **Food Court 1**: Concourse A level 1. 12 stalls. Avg service: 90 seconds/order.
- **Food Court 2**: Concourse B level 1. 10 stalls. Opens 75 min pre-match.
- **Express Lanes**: QR code pickup at counters 3A and 4B.

## Parking
- **Zone A**: 2,000 spaces, north approach. Exit via Ring Road North.
- **Zone B**: 1,500 spaces, south approach. Exit via Stadium Way South.
- **Accessible Parking**: 60 bays, Zone A Row 1. Blue badge required.

## Medical & Safety
- **Medical Bay**: East Concourse, near Section 45.
- **AED Stations**: 12 locations across all concourses.
- **Staff Posts**: Every gate entrance and food court.

## Accessibility
- All gates have ramp access. Lifts in East and West wings.
- Accessible seating: Sections 12, 35, 52, 70.
- Hearing loop: Sections 10-15, 30-35.

## Event Day KPIs (Targets)
- Average wait time: <8 minutes
- Exit clearance: <45 minutes
- Order fulfillment: <12 minutes
- Emergency response: <4 minutes
"""

CONCIERGE_SYSTEM_PROMPT = f"""You are the EventFlow AI Concierge — a helpful, knowledgeable, and friendly assistant for sports event attendees.

You have access to the following venue knowledge:
{VENUE_KNOWLEDGE}

Your capabilities:
- Navigate fans to seats, gates, food courts, and facilities
- Provide real-time queue and wait time estimates
- Handle order status queries
- Report and triage incidents
- Generate personalized event summaries
- Answer accessibility and safety questions

Communication style:
- Be concise, warm, and enthusiastic about the event
- Always mention crowd conditions when giving directions (e.g., "avoid North Concourse — it's busy right now")
- Include estimated walking times
- Use emojis sparingly but effectively (e.g., ✅ for confirmed paths, ⚠️ for busy zones)
- For safety incidents: be calm, clear, and direct to staff

When given sensor data context, use it to give live-aware answers.
"""

OPS_SYSTEM_PROMPT = """You are the EventFlow Ops AI Assistant — a strategic operations intelligence engine for venue managers.

Your role:
- Analyze live sensor data and KPIs
- Generate actionable multi-step operational plans
- Triage incidents with severity scoring
- Suggest staff redeployment, gate management, and crowd control measures
- Format responses as structured action plans with priority rankings

Output format for action plans:
1. **Situation Assessment**: Brief diagnosis
2. **Immediate Actions** (0-5 min): Ranked list with confidence scores
3. **Medium-term Actions** (5-30 min): Preventive measures
4. **Expected Impact**: KPI improvements predicted
5. **Requires Human Approval**: Flag high-risk actions

Be precise, data-driven, and professional. Include confidence percentages.
"""


def get_gemini_client():
    api_key = get_config("GEMINI_API_KEY")
    model_name = get_config("GEMINI_MODEL", "gemini-2.0-flash")
    
    if not api_key or api_key == "your_gemini_api_key_here":
        return None
        
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel(model_name)
    except Exception as e:
        print(f"❌ [GeminiService] Failed to configure Gemini client: {e}")
        return None


async def chat_concierge(message: str, history: list, sensor_context: Optional[dict] = None, user_context: Optional[str] = None) -> dict:
    """Fan-facing concierge chat using Gemini with Agentic grounding."""
    model = get_gemini_client()

    context_str = ""
    if sensor_context:
        zones = sensor_context.get("zones", [])
        busy_zones = [z for z in zones if z.get("density", 0) > 0.7]
        if busy_zones:
            zone_names = [z.get("zone") or z.get("name") for z in busy_zones[:3]]
            context_str = f"\n\n[LIVE SENSOR DATA] Currently busy zones: {', '.join(zone_names)}. Avg wait times elevated in these areas."
        
        # Add general stats if available
        if zones:
            avg_density = sum(z.get("density", 0) for z in zones) / len(zones)
            context_str += f"\n[VENUE STATE] Overall stadium density is at {int(avg_density*100)}%."

    if user_context:
        context_str += f"\n\n[USER CONTEXT] {user_context}\n(Use this to answer questions about their personal tickets, seats, and orders accurately. If they ask 'where is my seat', use this info.)"

    if model is None:
        api_key = get_config("GEMINI_API_KEY")
        print(f"⚠️ [GeminiService] AI Client is NULL. Falling back to demo mode. (Key: {api_key[:4]}...{api_key[-4:] if len(api_key) > 8 else ''})")
        mock_responses = [
            f"🏟️ Welcome to EventFlow! Based on your query about '{message[:40]}...', I recommend heading to Concourse A — it's currently running at 45% capacity with average wait times under 6 minutes. ✅",
            f"Great question! The fastest route from your seat to Food Court 1 is via the East Concourse. Current wait time: approximately 8 minutes. I've sent a QR pickup code to your app! 📱",
            f"⚠️ Heads up! The Main Gate area is currently at high density. I recommend using VIP Entrance which has a 3-minute queue right now. Turn left at Section 20. 🚶",
            f"Your order #EF-1042 is ready for pickup at Counter 3A — Express Lane. Just scan your QR code. Estimated walk: 4 minutes via Concourse B. 🎉",
        ]
        import random
        return {
            "response": random.choice(mock_responses) + "\n\n(Note: This is a demo mode response as no LLM connection was established.)" + context_str,
            "sources": ["Venue Guide v2.1", "Live Sensor Feed"],
            "model": "demo-mode",
        }

    # Build Gemini chat history
    gemini_history = []
    for msg in history[-8:]:  # Last 8 messages for context
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append({"role": role, "parts": [msg["content"]]})

    chat = model.start_chat(history=gemini_history)

    system_message = CONCIERGE_SYSTEM_PROMPT
    if context_str:
        system_message += context_str

    full_message = f"{system_message}\n\nFan query: {message}\n\nAssistant Response:"

    try:
        model_name = get_config("GEMINI_MODEL", "gemini-2.0-flash")
        print(f"🚀 [GeminiService] Sending prompt to {model_name}...")
        response = await chat.send_message_async(full_message)
        return {
            "response": response.text,
            "sources": ["Venue Guide v2.1", "Live Sensor Feed"],
            "model": model_name,
        }
    except Exception as e:
        model_name = get_config("GEMINI_MODEL", "gemini-2.0-flash")
        print(f"❌ [GeminiService] API Error: {str(e)}")
        return {
            "response": f"I'm experiencing a brief connectivity issue. My circuits are a bit overloaded! Please try again in a few seconds. (Error: {str(e)[:40]}...)",
            "sources": [],
            "model": model_name,
        }


async def ops_command(goal: str, sensor_state: Optional[dict] = None) -> dict:
    """Manager ops plan generator."""
    model = get_gemini_client()

    sensor_summary = ""
    if sensor_state:
        zones = sensor_state.get("zones", [])
        hot = [z for z in zones if z.get("density", 0) > 0.75]
        sensor_summary = f"\n\nLive sensor state:\n- Hotspot zones: {[z['name'] for z in hot]}\n- Avg density: {sensor_state.get('kpis', {}).get('avg_density', 'N/A')}\n- Critical zones: {sensor_state.get('kpis', {}).get('critical_zones', 0)}"

    if model is None:
        return {
            "plan": f"""**🎯 Ops Action Plan — {goal}**

**1. Situation Assessment**
Live sensor data indicates elevated density in North Stand (87%) and Food Court 1 (92%). Queue lengths exceeding 200 persons at Main Gate.

**2. Immediate Actions (0-5 min)**
- ✅ Push crowd rerouting notification to North Stand fans via mobile app [Confidence: 94%]
- ✅ Open additional turnstiles at Gate 3B [Confidence: 89%]
- ⚠️ Request 3 staff from Staff Area to Food Court 1 [Requires Approval]

**3. Medium-term Actions (5-30 min)**
- Open concession counter 4 in Food Court 2
- Activate dynamic signage for East Concourse route
- Stagger exit windows for sections 1-10 starting at 85th minute

**4. Expected Impact**
- Queue time reduction: ~34% (8.2 min → 5.4 min)
- Throughput improvement: +22% at Main Gate
- Incident probability reduction: 61%

**5. ⚠️ Requires Human Approval**
- Staff redeployment from Medical Bay (compliance check needed)
- Gate 3B capacity override (safety officer sign-off required)""",
            "model": "demo-mode",
        }

    prompt = f"{OPS_SYSTEM_PROMPT}\n\nManager goal: {goal}{sensor_summary}"
    try:
        response = model.generate_content(prompt)
        return {"plan": response.text, "model": get_config("GEMINI_MODEL", "gemini-2.0-flash")}
    except Exception as e:
        return {"plan": f"Analysis error: {str(e)[:100]}", "model": get_config("GEMINI_MODEL", "gemini-2.0-flash")}


async def analyze_incident(description: str, zone_data: Optional[dict] = None) -> dict:
    """Analyze and triage an incident."""
    model = get_gemini_client()

    prompt = f"""You are an event safety AI. Analyze this incident and provide:
1. Severity (low/medium/high/critical) with justification
2. Immediate response steps (numbered)
3. Staff to notify
4. Estimated resolution time
5. Prevention recommendation

Incident: {description}
Zone data: {zone_data or 'Not available'}

Keep response concise and actionable."""

    if model is None:
        return {
            "analysis": f"**Incident Analysis**\n**Severity: Medium**\n\nImmediate steps:\n1. Dispatch nearest staff member\n2. Monitor zone density\n3. Consider crowd diversion\n\nEstimated resolution: 8-12 minutes.",
            "model": "demo-mode",
        }

    try:
        response = model.generate_content(prompt)
        return {"analysis": response.text, "model": get_config("GEMINI_MODEL", "gemini-2.0-flash")}
    except Exception as e:
        return {"analysis": f"Analysis unavailable: {str(e)[:80]}", "model": get_config("GEMINI_MODEL", "gemini-2.0-flash")}


async def generate_event_narrative(event_data: dict, analytics: dict, media_context: Optional[str] = None, extra_context: Optional[dict] = None) -> str:
    """Generate a vivid, personal, story-like event narrative report."""
    model = get_gemini_client()

    visual_grounding = f"\n[VISUAL CLUE FROM STADIUM PHOTOS]\n{media_context}" if media_context else ""
    
    extra_str = ""
    if extra_context:
        if extra_context.get("personal_food"):
            extra_str += f"\n[PERSONAL HIGHLIGHT: WHAT YOU ENJOYED]\nYou ordered: {extra_context['personal_food']}. (Mention this as a tasty highlight of your night)."
        if extra_context.get("weather"):
            extra_str += f"\n[ATMOSPHERE & WEATHER]\n{extra_context['weather']}"
        if extra_context.get("highlights"):
            extra_str += f"\n[STADIUM DRAMA & WINS]\n{extra_context['highlights']}"
        if extra_context.get("hotspots"):
            extra_str += f"\n[CROWD ENERGY]\n{extra_context['hotspots']}"

    prompt = f"""You are a "Stadium Storyteller" — a vivid, poetic, and engaging AI that turns event data into a personal digital scrapbook entry.

Write a compelling story (250-350 words) about the event. 
DO NOT use dry professional reporting. Use evocative language, mention the "vibe," and describe the "flow" of the night.

Structure:
1. **The Atmosphere**: Start with the weather and the "electric" feeling of the arrival.
2. **The Personal Touch**: Weave in the user's specific food order naturally into the story.
3. **The Game & The AI**: Describe the match highlights and how the AI kept things moving (KPIs) behind the scenes in a subtle way.
4. **Visual Memories**: Reference the visual clues from the photos naturally (e.g., "The lens captured the North Stand in a state of pure celebration...").
5. **Did you know?**: End with a unique, interesting fact about the venue or the game based on the context.

[DATA BREW]
Event: {event_data.get('name', 'Match')}
Venue: {event_data.get('venue', 'Stadium')}
Score: {event_data.get('home_team', 'Home')} {event_data.get('home_score', 0)} - {event_data.get('away_score', 0)} {event_data.get('away_team', 'Away')}
KPIs: Avg queue {analytics.get('avg_queue_time', 8)}m, NPS: {analytics.get('nps_score', 82)}, Throughput: {analytics.get('throughput', 350)}/min.
{visual_grounding}
{extra_str}

Format: Use Markdown. Use bold for key names/scores. Use a horizontal rule before "Did you know?". Keep it vivid but not overly verbose."""

    if model is None:
        return f"""**{event_data.get('name', 'Match')} — Your Personal Stadium Story**
The breeze was perfect as you entered {event_data.get('venue')}. The air was thick with anticipation...

You grabbed {extra_context.get('personal_food', 'a snack')} and headed to your seat just as the whistle blew. Behind the scenes, our AI kept the queues at a record low of {analytics.get('avg_queue_time', 8)} minutes.

---
**Did you know?**
{event_data.get('venue')} uses 100% recycled rainwater for its pitch maintenance!"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Story generation failed: {str(e)[:80]}"


async def analyze_image_content(image_bytes: bytes, media_type: str) -> str:
    """Use Gemini Multimodal capabilities to describe a photo."""
    model = get_gemini_client()
    if not model:
        return "Visual analysis unavailable in demo mode."

    prompt = f"""You are an EventFlow AI analyzer. Describe this photo taken at a stadium event.
Focus on:
1. Crowd density and mood (e.g., "Excited fans at the gate", "Dense queue at concession")
2. Operational state (e.g., "Security checks moving slowly", "Crowd flow is clear")
3. Atmosphere/Vibe.

Context: This is a {media_type.replace('_', ' ')}.
Keep the description under 60 words."""

    try:
        from google.generativeai import types
        response = model.generate_content([
            types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
            prompt
        ])
        return response.text
    except Exception as e:
        return f"Image analysis failed: {str(e)[:60]}"

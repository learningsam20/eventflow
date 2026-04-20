"""
Simulator Engine: Digital Twin with synthetic crowd agents.
"""
import asyncio
import math
import random
from datetime import datetime
from typing import AsyncGenerator

ZONES = [
    {"id": "north_stand", "name": "North Stand", "x": 1, "y": 0, "type": "seating"},
    {"id": "south_stand", "name": "South Stand", "x": 1, "y": 2, "type": "seating"},
    {"id": "east_wing", "name": "East Wing", "x": 2, "y": 1, "type": "seating"},
    {"id": "west_wing", "name": "West Wing", "x": 0, "y": 1, "type": "seating"},
    {"id": "main_gate", "name": "Main Gate", "x": 1, "y": 3, "type": "gate"},
    {"id": "vip_entrance", "name": "VIP Entrance", "x": 2, "y": 3, "type": "gate"},
    {"id": "concourse_a", "name": "Concourse A", "x": 0, "y": 2, "type": "concourse"},
    {"id": "concourse_b", "name": "Concourse B", "x": 2, "y": 0, "type": "concourse"},
    {"id": "food_court_1", "name": "Food Court 1", "x": 0, "y": 0, "type": "food"},
    {"id": "food_court_2", "name": "Food Court 2", "x": 2, "y": 2, "type": "food"},
    {"id": "parking_a", "name": "Parking Zone A", "x": 0, "y": 3, "type": "parking"},
    {"id": "parking_b", "name": "Parking Zone B", "x": 2, "y": 3, "type": "parking"},
    {"id": "medical_bay", "name": "Medical Bay", "x": 1, "y": 1, "type": "facility"},
    {"id": "press_box", "name": "Press Box", "x": 0, "y": 1, "type": "facility"},
    {"id": "staff_area", "name": "Staff Area", "x": 2, "y": 1, "type": "facility"},
    {"id": "emergency_exit", "name": "Emergency Exit", "x": 1, "y": 3, "type": "exit"},
]

SCENARIOS = {
    "entry_surge": {
        "name": "Entry Surge",
        "description": "Pre-match gates open. 40,000 fans flooding in over 45 minutes.",
        "icon": "🌊",
        "duration_ticks": 60,
        "hotspots": ["main_gate", "vip_entrance", "concourse_a", "concourse_b"],
        "peak_density": 0.95,
    },
    "halftime_rush": {
        "name": "Halftime Rush",
        "description": "15-minute concession storm. Food courts overwhelmed.",
        "icon": "⚡",
        "duration_ticks": 40,
        "hotspots": ["food_court_1", "food_court_2", "concourse_a", "concourse_b"],
        "peak_density": 0.92,
    },
    "emergency_evacuation": {
        "name": "Emergency Evacuation",
        "description": "Critical incident. Controlled evacuation via emergency routes.",
        "icon": "🚨",
        "duration_ticks": 50,
        "hotspots": ["emergency_exit", "main_gate", "parking_a", "parking_b"],
        "peak_density": 0.99,
    },
    "weather_impact": {
        "name": "Weather Impact",
        "description": "Heavy rain drives fans indoors. Concourses become congested.",
        "icon": "🌧️",
        "duration_ticks": 45,
        "hotspots": ["concourse_a", "concourse_b", "food_court_1", "food_court_2"],
        "peak_density": 0.88,
    },
    "post_match_exit": {
        "name": "Post-Match Exit",
        "description": "Final whistle. 70,000 fans heading to parking and transport.",
        "icon": "🏁",
        "duration_ticks": 55,
        "hotspots": ["parking_a", "parking_b", "main_gate", "emergency_exit"],
        "peak_density": 0.97,
    },
}


class SimulatorEngine:
    def __init__(self):
        self.running = False
        self.scenario_key = "entry_surge"
        self.tick = 0
        self.speed = 1  # ticks per second
        self.zone_densities = {z["id"]: random.uniform(0.1, 0.3) for z in ZONES}
        self.incidents = []

    def start(self, scenario_key: str, speed: int = 1):
        self.scenario_key = scenario_key
        self.tick = 0
        self.running = True
        self.speed = max(1, min(speed, 10))
        self.zone_densities = {z["id"]: random.uniform(0.05, 0.2) for z in ZONES}
        self.incidents = []

    def stop(self):
        self.running = False

    def _update_densities(self):
        scenario = SCENARIOS.get(self.scenario_key, SCENARIOS["entry_surge"])
        hotspots = scenario["hotspots"]
        peak = scenario["peak_density"]
        duration = scenario["duration_ticks"]

        # Sinusoidal surge in hotspots
        progress = min(self.tick / duration, 1.0)
        surge = math.sin(progress * math.pi) * peak

        for zone in ZONES:
            zid = zone["id"]
            base = self.zone_densities[zid]
            if zid in hotspots:
                target = surge * random.uniform(0.85, 1.0)
            else:
                target = surge * random.uniform(0.1, 0.45)
            # Smooth transition
            self.zone_densities[zid] = round(
                base + (target - base) * 0.3 + random.uniform(-0.02, 0.02), 3
            )
            self.zone_densities[zid] = max(0.0, min(1.0, self.zone_densities[zid]))

    def _generate_incidents(self):
        new_incidents = []
        for zone in ZONES:
            density = self.zone_densities[zone["id"]]
            if density > 0.88 and random.random() < 0.15:
                severity = "critical" if density > 0.95 else "high"
                new_incidents.append({
                    "zone": zone["name"],
                    "zone_id": zone["id"],
                    "severity": severity,
                    "message": self._incident_message(zone["id"], density),
                    "timestamp": datetime.utcnow().isoformat(),
                    "density": density,
                })
        return new_incidents

    def _incident_message(self, zone_id: str, density: float) -> str:
        messages = {
            "main_gate": f"Gate queue critical ({int(density * 300)} persons). Open auxiliary lanes.",
            "food_court_1": f"Food Court 1 overwhelmed. Avg wait: {int(density * 20)} min.",
            "food_court_2": f"Food Court 2 at capacity. Suggest counter 4 opening.",
            "concourse_a": f"Concourse A restricted flow. Recommend crowd dispersal.",
            "north_stand": f"North Stand density alert: {int(density * 100)}% capacity.",
            "parking_a": f"Parking Zone A exit backed up. Stagger fan release.",
            "emergency_exit": f"Emergency exit flow active. Monitor clearance rate.",
        }
        return messages.get(zone_id, f"{zone_id} density at {int(density * 100)}%. Monitor closely.")

    def get_frame(self) -> dict:
        self._update_densities()
        new_incidents = self._generate_incidents()
        self.incidents.extend(new_incidents)
        # Keep last 20 incidents
        self.incidents = self.incidents[-20:]

        scenario = SCENARIOS.get(self.scenario_key, SCENARIOS["entry_surge"])
        zones_data = []
        for z in ZONES:
            d = self.zone_densities[z["id"]]
            zones_data.append({
                **z,
                "density": d,
                "queue_length": int(d * 250),
                "wait_time": round(d * 18, 1),
                "status": "critical" if d > 0.88 else "high" if d > 0.70 else "medium" if d > 0.45 else "low",
            })

        self.tick += 1
        return {
            "tick": self.tick,
            "scenario": scenario["name"],
            "scenario_key": self.scenario_key,
            "zones": zones_data,
            "incidents": new_incidents,
            "all_incidents": self.incidents[-10:],
            "kpis": {
                "avg_density": round(
                    sum(self.zone_densities.values()) / len(self.zone_densities), 3
                ),
                "hotspot_count": sum(1 for d in self.zone_densities.values() if d > 0.75),
                "critical_zones": sum(1 for d in self.zone_densities.values() if d > 0.88),
                "total_queue": sum(int(d * 250) for d in self.zone_densities.values()),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def stream(self) -> AsyncGenerator[dict, None]:
        interval = 1.0 / self.speed
        while self.running:
            yield self.get_frame()
            await asyncio.sleep(interval)


# Global singleton
sim_engine = SimulatorEngine()

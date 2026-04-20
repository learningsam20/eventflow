# 🏟️ EventFlow: AI-Native Physical Event Orchestration

![EventFlow Concept](static/eventflow_concept.png)

**EventFlow** is the operating system for physical events. By fusing real-time sensor telemetry with multi-modal AI, we transform chaotic crowd logistics into choreographed, high-engagement experiences. Designed for high-stakes championships and massive concerts, EventFlow reduces venue friction and provides agentic assistance through a unified, intelligence-first interface.

---

## 🎯 Design Philosophy & UX

### Intelligence-First Architecture
Traditional event management tools bury mission-critical data in nested menus and static dashboards. EventFlow flips this paradigm by placing a **conversational, agentic concierge** at the heart of the experience. Information isn't just displayed; it is *orchestrated*.

### The "Event Night" Aesthetic
- **Visual Rationale**: Our UI employs a high-contrast dark-mode palette with vivid neon accents—**Electric Blue** for movement, **Royal Purple** for intelligence, and **Safety Red** for incidents. 
- **Environmental Adaptive**: This glassmorphism design ensures readability in high-glare stadium environments while mirroring the modern, high-tech energy of professional sports and concerts.

---

## 🏗️ Technical Architecture

EventFlow uses a multi-layered architecture designed for real-time sensor fusion and predictive reasoning.

```mermaid
graph TD
    subgraph "Data Ingress (Edge)"
        S1[Wi-Fi/BLE Pings]
        S2[Turnstile Records]
        S3[Mobile App Geo-Events]
        S4[Camera CV Analytics]
    end

    subgraph "Logic & Orchestration (FastAPI)"
        API[API Gateway]
        SIM[Digital Twin Simulator]
        RAG[RAG Logic Engine]
        ANL[Analytics Aggregator]
        AUTH[JWT Security]
    end

    subgraph "Intelligence (GCP)"
        GEM[Gemini 1.5 Flash]
        VEC[Vector Context Store]
        MAP[Google Maps API]
    end

    subgraph "Persistence"
        DB[(Cloud SQL / SQLite)]
        IMG[Cloud Storage]
    end

    subgraph "Presentation"
        FAN[Fan Web App]
        OPS[Organizer Dashboard]
    end

    S1 & S2 & S3 & S4 --> API
    API <--> SIM
    API <--> RAG
    RAG <--> GEM
    GEM <--> VEC
    API --> ANL
    ANL --> DB
    FAN & OPS <--> API
    FAN & OPS --> MAP
```

---

## 🔄 Component Interactions

### 🤖 AI Concierge Flow (Fan Side)
When a fan interacts with the AI Concierge, the system performs "Agentic Grounding" to provide live-aware navigation advice.

```mermaid
sequenceDiagram
    participant F as Fan (Mobile App)
    participant B as Backend (FastAPI)
    participant S as Sensor Feed
    participant G as Gemini 1.5 AI

    F->>B: "Where is my seat and is Gate 1 busy?"
    B->>S: Get Latest Congestion Data
    S-->>B: Gate 1: 85% Density (Busy)
    B->>B: Retrieve User Ticket (Section 12)
    B->>G: Prompt: User at Sec 12, Gate 1 Busy. Suggest Route.
    G-->>B: Suggested Route: Use VIP Entrance (5% density)
    B-->>F: "Head to VIP Entrance. 4m walk. Gate 1 is busy! ✅"
```

### 🏆 Operational Triage (Manager Side)
EventFlow helps venue managers manage incidents by synthesizing simulator projections with live sensor data.

```mermaid
sequenceDiagram
    participant O as Organizer (Dashboard)
    participant B as Backend (FastAPI)
    participant SIM as Simulator Engine
    participant G as Gemini 1.5 AI

    SIM->>B: Incident: Congestion Surge at Gate 3
    B->>O: Alert: High Pressure in North Stand
    O->>B: "Suggest Mitigation Plan"
    B->>G: Goal: Reduce Gate 3 Pressure. Context: Staff at Gate 4.
    G-->>B: Action Plan: Open Gate 3B + Redirect Staff
    B-->>O: Interactive Ops Plan (Ranked Actions)
```

---

## ☁️ Deployment Architecture (Google Cloud)

EventFlow is optimized for native deployment on Google Cloud Platform, leveraging serverless scale and advanced security.

```mermaid
graph LR
    Dev((Developer))
    User((User))

    subgraph "Google Cloud Ecology"
        AR[Artifact Registry]
        CR[Cloud Run Service]
        SM[Secret Manager]
        SQL[(Cloud SQL)]
        CS[Cloud Storage]
    end

    subgraph "Managed Services"
        GAI[Gemini AI API]
        GMA[Google Maps API]
    end

    Dev -- push --> AR
    AR -- deploy --> CR
    SM -- inject secrets --> CR
    CR -- persist --> SQL
    CR -- storage --> CS
    CR -- intelligence --> GAI
    CR -- geospatial --> GMA
    User -- HTTPS --> CR
```

---

## 📋 Evaluation Focus Areas

### 🛡️ Code Quality & Security
- **Security Headers**: Custom middleware enforces HSTS, CSP-lite, and frame protection.
- **X-Process-Time**: Every API response includes efficiency audit headers.
- **Authentication**: Robust JWT structure with bcrypt hashing.

### 🧪 Testing
- **Automated Validation**: Pytest suite validated core API health and auth logic.
- **Mock Integrity**: Designed for offline validation with Gemini service mocks.

### ♿ Accessibility
- **ARIA Standards**: Sidebar and forms are fully accessible via screen-readers and keyboard navigation.

---

## 🐳 Getting Started

1. **Clone & Setup**: Install dependencies for both `frontend` and `backend`.
2. **Environment**: Add `GOOGLE_API_KEY` and `VITE_GOOGLE_MAPS_API_KEY`.
3. **Run**: Use `python main.py` in the backend and `npm run dev` in the frontend.

*Built with ❤️ for the ultimate event experience.*

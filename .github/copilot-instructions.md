# GitHub Copilot Instructions

## Project: Gemini Guardian – Real-Time Triage & First Aid Vision

### Industry

Healthcare & Emergency Response

### Mission

Build a low-latency, real-time emergency assistance application that turns a smartphone into an intelligent medical dispatcher. The system uses live camera and audio input to reason about medical emergencies and guide bystanders with clear, calm, step-by-step first aid instructions.

**Copilot must prioritize:**

- ⚡ **Speed** – Low-latency responses for real-time assistance
- 🎯 **Accuracy** – Correct medical guidance is critical
- 📖 **Clarity** – Instructions must be unambiguous
- 🔒 **Reliability** – System must work under pressure
- 🛡️ **Safety-first UX** – Defensive, predictable behavior

> ⚠️ **This is a life-critical application.** Code must be clean, defensive, and predictable.

---

## 🧠 Product Concept

**Gemini Guardian** is an "eyes-on" emergency assistant that:

- Uses live video and audio streams
- Reasons about severity (not just detection)
- Provides real-time verbal guidance
- Optimized for panic scenarios and unstable environments

---

## 🏗️ Full-Stack Tech Stack

### Frontend

| Category         | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Framework        | Next.js (App Router)                            |
| Language         | TypeScript (strict mode)                        |
| State Management | Zustand (client-only, ephemeral)                |
| Styling          | Tailwind CSS                                    |
| API              | Next.js Route Handlers + Server Actions         |
| AI Integration   | Gemini Vision + Audio (abstracted via services) |
| Architecture     | Server-first, component colocation              |

**Frontend Design Principles:**

- Mobile-first usage
- Low cognitive load
- Large, clear UI elements
- Voice-first interaction patterns

### Backend

| Category       | Technology                            |
| -------------- | ------------------------------------- |
| Framework      | FastAPI                               |
| Language       | Python 3.11+                          |
| Server         | Uvicorn (async)                       |
| AI Integration | Gemini 2.0 Flash for video analysis   |
| Architecture   | Controller-Service-Repository pattern |

---

## 📂 Project Directory Structure

### Frontend Structure (Next.js)

```
/frontend
├── /app                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   └── /api                # Route handlers
├── /components             # React components
│   ├── /ui                 # Reusable UI components
│   └── /features           # Feature-specific components
├── /lib                    # Utilities and helpers
├── /services               # API service abstractions
├── /stores                 # Zustand state stores
├── /types                  # TypeScript type definitions
├── /public                 # Static assets
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

### Backend Structure (FastAPI)

```
/backend
├── /config                 # DB connection, environment variables
├── /src
│   ├── /controllers        # Request handling & HTTP status codes
│   ├── /services           # Core business logic (the "brain")
│   ├── /repositories       # Data access logic (queries/raw DB calls)
│   ├── /models             # Database schemas/entities
│   ├── /routes             # API endpoint definitions
│   ├── /middlewares        # Auth guards, error handlers, loggers
│   ├── /utils              # Reusable helper functions
│   ├── /dtos               # Data Transfer Objects (input/output validation)
│   ├── app.py              # FastAPI app setup
│   └── server.py           # Entry point; boots uvicorn
├── /tests                  # Unit and integration tests
├── .env                    # Secret environment variables
├── requirements.txt        # Python dependencies
└── main.py                 # Alternative entry point
```

---

## 🔧 Backend Implementation Guidelines

### 1. API Routes (`/src/routes/routes.py`)

```python
from fastapi import APIRouter
from .controllers import handle_video_feed, get_instructions

router = APIRouter()

@router.post("/upload-video")
async def upload_video(video_feed: str):
    return await handle_video_feed(video_feed)

@router.get("/instructions")
async def instructions(incident_type: str):
    return await get_instructions(incident_type)
```

### 2. Services (`/src/services/services.py`)

```python
from typing import Dict

async def analyze_video_feed(video_feed: str) -> Dict:
    """Process video feed through Gemini AI model."""
    result = await gemini_model.process(video_feed)
    return result

async def provide_instructions(severity: int) -> str:
    """Return appropriate first aid instructions based on severity."""
    instructions_map = {
        1: "Apply pressure 2 inches higher.",
        2: "Tilt the head back further for the rescue breath.",
    }
    return instructions_map.get(severity, "Wait for medical help to arrive.")
```

### 3. Controllers (`/src/controllers/controllers.py`)

```python
from fastapi import HTTPException
from .services import analyze_video_feed, provide_instructions

async def handle_video_feed(video_feed: str):
    try:
        analysis_result = await analyze_video_feed(video_feed)
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_instructions(incident_type: str):
    severity = determine_severity_from_incident(incident_type)
    instructions = await provide_instructions(severity)
    return instructions
```

### 4. Middleware (`/src/middlewares/middlewares.py`)

```python
from starlette.middleware.base import BaseHTTPMiddleware
import logging

class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logging.error(f"Request error: {str(e)}")
            raise
```

### 5. Models (`/src/models/models.py`)

```python
from pydantic import BaseModel
from datetime import datetime

class IncidentReport(BaseModel):
    id: int
    type: str
    severity: int
    timestamp: datetime
```

### 6. DTOs (`/src/dtos/dtos.py`)

```python
from pydantic import BaseModel

class VideoUploadRequest(BaseModel):
    video_url: str

class InstructionResponse(BaseModel):
    instruction: str
    severity: int
```

### 7. Environment Configuration

```python
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
```

### 8. Server Entry Point (`server.py`)

```python
import uvicorn
from .app import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 🎨 Frontend Implementation Guidelines

### Component Patterns

- Use Server Components by default
- Add `'use client'` only when necessary (interactivity, hooks)
- Colocate components with their routes when possible
- Extract reusable UI to `/components/ui`

### State Management with Zustand

```typescript
// /stores/emergencyStore.ts
import { create } from "zustand";

interface EmergencyState {
  isActive: boolean;
  severity: number | null;
  instructions: string[];
  setActive: (active: boolean) => void;
  setSeverity: (severity: number) => void;
}

export const useEmergencyStore = create<EmergencyState>((set) => ({
  isActive: false,
  severity: null,
  instructions: [],
  setActive: (active) => set({ isActive: active }),
  setSeverity: (severity) => set({ severity })
}));
```

### API Service Pattern

```typescript
// /services/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadVideo(videoData: Blob): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/upload-video`, {
    method: "POST",
    body: videoData
  });
  if (!response.ok) throw new Error("Video upload failed");
  return response.json();
}
```

---

## ✅ Code Quality Standards

### General

- Write defensive code with proper error handling
- Add meaningful comments for complex logic
- Use TypeScript strict mode (frontend)
- Use type hints (backend Python)
- Write unit tests for critical paths

### Testing

```python
# /tests/test_main.py
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_upload_video():
    response = client.post("/upload-video", json={"video_url": "http://example.com/video"})
    assert response.status_code == 200

def test_get_instructions():
    response = client.get("/instructions?incident_type=cardiac_arrest")
    assert response.status_code == 200
```

---

## 🚀 Quick Start Commands

### Backend

```bash
# Install dependencies
pip install fastapi uvicorn python-dotenv

# Run development server
uvicorn main:app --reload
//--host 0.0.0.0 --port 8000
```

### Frontend

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 🎯 Copilot Behavior Guidelines

1. **Always consider the life-critical nature** of this application
2. **Prefer async/await** for all I/O operations
3. **Handle errors gracefully** with meaningful messages
4. **Keep latency low** – optimize for real-time performance
5. **Follow the established directory structure** exactly
6. **Write self-documenting code** with clear naming
7. **Add input validation** on all API endpoints
8. **Log errors** but never expose sensitive data
9. **Test edge cases** especially for emergency scenarios
10. **Mobile-first** for all frontend components

---

## 📋 End Goals

- ⚡ Fast, scalable backend with real-time video analysis
- 🏥 Life-saving first aid instructions delivery
- 📱 Seamless mobile-first user experience
- 🔄 Low-latency bidirectional communication
- 🛡️ Robust error handling for critical scenarios

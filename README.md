# AutoPilot AI Workspace

> A production-grade, multi-agent AI business automation platform. Describe your business goal and specialized AI agents — Product Manager, Developer, Marketing Expert, Data Analyst, and Operations — autonomously plan, build, and execute it in real time.

---

## Live Deployment

| Service | URL |
|---------|-----|
| **Frontend (App)** | https://frontend-virid-ten-21.vercel.app |
| **Backend API** | https://autopilot-ai-backend.vercel.app |
| **API Docs (Swagger)** | https://autopilot-ai-backend.vercel.app/docs |
| **Health Check** | https://autopilot-ai-backend.vercel.app/health |

---

## Tech Stack

### Frontend
| | Technology |
|-|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + custom glassmorphic design system |
| Animation | Framer Motion |
| State Management | Zustand (persisted to localStorage) |
| Authentication | Firebase Auth — Email/Password + Google OAuth |
| Real-time | WebSocket client with serverless graceful fallback |
| Workflow Graph | React Flow (@xyflow/react) |
| Deployment | Vercel |

### Backend
| | Technology |
|-|-----------|
| Framework | FastAPI (Python 3.12) |
| AI Orchestration | LangGraph + LangChain |
| LLM | OpenAI GPT-4o-mini |
| Agents | 5 specialized agents (PM, Dev, Marketing, Analyst, Operations) |
| Database | Supabase (PostgreSQL) with in-memory mock fallback |
| Deployment | Vercel Serverless (`@vercel/python`) |

---

## Architecture

```
User ──→ Firebase Auth ──→ Next.js Frontend (Vercel)
                                    │
                           Zustand Store (localStorage)
                                    │
                          FastAPI Backend (Vercel)
                                    │
                         LangGraph Orchestrator
                    ┌───────────────────────────┐
                    │  Product Manager Agent    │ → Roadmap, user stories, RICE scoring
                    │  Developer Agent          │ → Architecture, tech stack, code plan
                    │  Marketing Agent          │ → GTM strategy, campaigns, content
                    │  Analyst Agent            │ → KPIs, metrics, risk analysis
                    │  Operations Agent         │ → Infrastructure, CI/CD, scaling
                    └───────────────────────────┘
                                    │
                          Supabase DB / Mock Store
                                    │
                       WebSocket → Real-time UI updates
```

---

## Features

### Authentication
- Email/Password sign-up and sign-in via Firebase
- Google OAuth — one-click sign-in
- Protected routes — all app pages require authentication
- Session persisted across page refreshes via Firebase + Zustand
- Profile update (display name) and password change in Settings

### AI Command Center (Chat)
- Send any business goal to the 5-agent LangGraph pipeline
- 4 quick-prompt chips for instant role-specific prompts
- Real-time thinking indicator while agents process
- Full markdown rendering (code blocks, headers, tables, lists)
- **History sidebar** — slide-out panel showing all past sessions; click any to restore
- **Export** — downloads the full project plan as a `.md` file
- **New Session** — starts a fresh conversation
- Auto Mode toggle — enables autonomous agent chaining
- Enter to send · Shift+Enter for newline · character counter

### Dashboard — Command Hub
- Live stats: active tasks, completed count, system health %, risks flagged
- Strategic overview card showing active agent and current job count
- **Active Pipeline** — list of all tasks; click any task to jump to its conversation in chat
- **Session History** — all past conversations; click to restore full message thread
- **Neural Suggestions** — dynamic AI recommendations based on current task state
- **Workspace Output** — file explorer for agent-generated artifacts
  - Click any file to open a preview modal with content
  - **Copy Content** — copies file text to clipboard
  - **Download Artifact** — saves file to your machine
- **Agent Activity Timeline** — live animated log of every agent action with timestamps

### Neural Units (Agents)
- 6 agent cards: Product Manager, Developer, Marketing, Analyst, Orchestrator, Operations
- Live status badge on each card (Idle / Thinking / Active)
- Capability tags listing each agent's core skills
- **Pause Matrix** — suspends all agent operations
- **Synchronize** — resumes agent operations
- Intelligence Health ring — animated circular progress showing task completion rate
- Neural Logs panel — last 4 agent activities

### Visual Workflow
- Interactive React Flow canvas — orchestrator centered, agents arranged in an ellipse
- Task nodes linked to their assigned agent nodes
- **Simulate Swarm / Stop** — toggles animated agent activity
- **Maximize** — fullscreens the graph canvas
- **Copy Link** — copies current URL to clipboard
- **Export JSON** — downloads workflow graph data as `.json`
- Minimap for canvas navigation
- Right panel: active task count, completion score bar, orchestrator insight text, collaboration log

### Intelligence Hub (Insights)
- 3 animated sparkline charts: System Throughput, Task Velocity, Market Resonance
- Channel Distribution — bar graph showing Twitter/LinkedIn/Product Hunt activity based on real agent data
- Agent Directive card — pulls the latest analyst agent reasoning text
- Sidebar metrics: active processes count, Neural ROI, Compute Saved (hours), Cluster Sync %
- **Execute Strategy** — navigates to AI Command Center

### Settings — Personal Hub
- Profile card: display name (editable), email (read-only from Firebase)
- **Update Profile** — saves display name change to Firebase
- **Password Update** — re-authenticates with current password, then updates in Firebase
- Visual Matrix: Obsidian / Neural / Stellar theme selector
- Signals & HUD toggles: Neural Thought Stream, Audio Feedback, Success HUD
- Integration Matrix: live Firebase Auth status, backend API status
- Team Cluster panel

### Global UI
- Fixed bottom dock (Sidebar) — navigates between all 5 sections; active route has animated indicator dot
- Autonomous mode toggle in dock
- User name display (from Firebase) with logout
- Fixed top bar — brand logo, **New Project** button, notification bell
- Notifications panel — activity feed with per-notification agent icons; **Clear All** button
- Animated neural mesh background
- Toast notifications for every user action
- Fully responsive layout

---

## All API Endpoints

Base URL: `https://autopilot-ai-backend.vercel.app`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/chat` | Send goal to multi-agent pipeline |
| `GET` | `/api/v1/conversations/` | List conversations for a user |
| `POST` | `/api/v1/conversations/` | Create a new conversation |
| `GET` | `/api/v1/conversations/{id}` | Get conversation + messages |
| `GET` | `/api/v1/conversations/{id}/messages` | Get messages for a conversation |
| `DELETE` | `/api/v1/conversations/{id}` | Delete a conversation |
| `GET` | `/api/v1/tasks/` | List tasks for a user |
| `PATCH` | `/api/v1/tasks/{id}` | Update task status/progress |
| `DELETE` | `/api/v1/tasks/{id}` | Delete a task |
| `GET` | `/api/v1/workflows/` | List workflows for a user |
| `GET` | `/api/v1/workflows/{id}/graph` | Get workflow node/edge graph |
| `GET` | `/api/v1/agents/activities` | Get agent activity log |
| `GET` | `/api/v1/files` | List workspace output files |
| `GET` | `/api/v1/files/{path}` | Get file content |
| `GET` | `/api/v1/search/global` | Global search across conversations + tasks |
| `WS` | `/ws/{conversation_id}` | Real-time event stream |

Interactive Swagger UI: https://autopilot-ai-backend.vercel.app/docs

---

## Agent Pipeline

```
User submits goal
        ↓
Product Manager  →  Features, user stories, RICE-prioritized task list
        ↓
Developer        →  System architecture, tech stack, implementation roadmap
        ↓
Marketing        →  GTM strategy, content calendar, channel recommendations
        ↓
Analyst          →  KPIs, risk matrix, optimization recommendations
        ↓
Operations       →  Infrastructure plan, CI/CD strategy, scaling approach
        ↓
Synthesize       →  Merge all outputs into final markdown response
                    Persist tasks + workflow graph to database
                    Broadcast real-time events via WebSocket
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.12+
- Firebase project (`auto-pilot-365fe`) with Email/Password + Google auth enabled

### Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC42URKayzE4CIviex-aGzwgy9I-LcbSQs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=auto-pilot-365fe.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=auto-pilot-365fe
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=auto-pilot-365fe.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1011426503463
NEXT_PUBLIC_FIREBASE_APP_ID=1:1011426503463:web:ae09052efe5527272cd702
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-HJBD8ZE871
```

```bash
npm run dev    # http://localhost:3000
```

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Create `.env`:
```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SECRET_KEY=your_secret
```

```bash
uvicorn app.main:app --reload    # http://localhost:8000
```

> **Note:** Backend runs in mock mode (in-memory store) when Supabase is not configured. Agent responses require `OPENAI_API_KEY`; without it the engine returns keyword-based fallback responses.

---

## Deployment Guide

### Vercel — Frontend

```bash
cd frontend
vercel --prod
```

Set these environment variables in Vercel dashboard (all `NEXT_PUBLIC_` must be build-time vars):

```
NEXT_PUBLIC_API_URL=https://autopilot-ai-backend.vercel.app
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

### Vercel — Backend

```bash
cd backend
vercel --prod
```

Set these environment variables:
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_ENV=production
CORS_ORIGINS=*
```

### Firebase Console (required for auth to work on Vercel)
1. Authentication → Sign-in method → **Enable Email/Password**
2. Authentication → Sign-in method → **Enable Google** (set support email)
3. Authentication → Settings → Authorized domains → **Add** `frontend-virid-ten-21.vercel.app`

---

## Project Structure

```
AutoPilot-AI-Workspace/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (app)/               # Protected routes (auth guard)
│   │   │   │   ├── dashboard/       # Command Hub
│   │   │   │   ├── chat/            # AI Command Center
│   │   │   │   ├── agents/          # Neural Units
│   │   │   │   ├── workflows/       # Visual Workflow
│   │   │   │   ├── insights/        # Intelligence Hub
│   │   │   │   ├── settings/        # Personal Hub
│   │   │   │   └── layout.tsx       # Auth guard + global shell
│   │   │   ├── auth/                # Sign-in / Sign-up page
│   │   │   └── page.tsx             # Landing redirect
│   │   ├── components/
│   │   │   ├── chat/                # ChatWindow, ChatInput, ChatMessage, ConversationHistory
│   │   │   ├── dashboard/           # TaskItem, FileExplorer, AgentActivityTimeline, NeuralSuggestions
│   │   │   ├── agents/              # AgentGrid
│   │   │   ├── workflow/            # WorkflowGraph, AgentNode, TaskNode, CustomEdge
│   │   │   ├── ui/                  # Sidebar, TopBar, GlobalOrchestrator, MeshBackground
│   │   │   └── auth/                # FirebaseProvider (auth state sync)
│   │   └── lib/
│   │       ├── store.ts             # Zustand store (persisted to localStorage)
│   │       ├── api.ts               # Typed REST API client
│   │       ├── firebase.ts          # Firebase init + auth + Google provider
│   │       ├── localAuth.ts         # Local auth fallback (no Firebase)
│   │       ├── websocket.ts         # WebSocket client + serverless fallback
│   │       └── export.ts            # Markdown project export
│   └── vercel.json
│
└── backend/
    ├── app/
    │   ├── api/                     # FastAPI route handlers
    │   │   ├── chat.py              # POST /chat + WebSocket /ws/{id}
    │   │   ├── conversations.py
    │   │   ├── tasks.py
    │   │   ├── workflows.py
    │   │   ├── agents.py
    │   │   ├── files.py
    │   │   └── search.py
    │   ├── agents/                  # LangChain agent implementations
    │   │   ├── pm_agent.py
    │   │   ├── dev_agent.py
    │   │   ├── marketing_agent.py
    │   │   ├── analyst_agent.py
    │   │   └── operations_agent.py
    │   ├── orchestrator/
    │   │   └── langgraph_engine.py  # LangGraph state machine
    │   ├── db/
    │   │   └── supabase_client.py   # Supabase + in-memory mock fallback
    │   ├── models/schemas.py
    │   ├── config.py
    │   └── main.py
    ├── api/index.py                 # Vercel entry point
    ├── requirements.txt
    └── vercel.json
```

---

## Known Limitations

| Limitation | Detail |
|-----------|--------|
| WebSocket on Vercel | Vercel serverless functions can't hold persistent connections. WebSocket falls back to REST responses automatically — all AI responses are returned synchronously and the app works fully. |
| Data persistence | Requires a connected Supabase project for cross-session DB persistence. Without it, the backend uses an in-memory mock (resets on cold start). Frontend data is persisted to localStorage so history works across refreshes. |
| OpenAI API | Full agent intelligence requires `OPENAI_API_KEY`. Without it the orchestrator returns heuristic keyword-based fallback responses. |

---

## Author

**Sunkireddy Barath**
- GitHub: [@sunkireddybarath07](https://github.com/sunkireddybarath07)
- Email: sunkireddybarath07@gmail.com

---

*Built with Next.js 14 · FastAPI · LangGraph · Firebase · Supabase · Vercel*

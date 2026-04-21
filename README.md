# 🚀 AutoPilot AI Workspace

> **An AI-powered multi-agent system that converts your high-level goals into structured workflows, automated tasks, and real-time execution plans.**

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/AI-LangGraph-orange)](https://langchain-ai.github.io/langgraph)
[![Supabase](https://img.shields.io/badge/DB-Supabase-3ECF8E)](https://supabase.com)

---

## ✨ What It Does

You type: _"Launch a marketing campaign for my SaaS product"_

AutoPilot AI Workspace automatically:
1. 🧠 **Breaks the goal into tasks** using 4 specialized AI agents
2. 🗂️ **Builds a visual workflow** with drag-and-drop nodes
3. 📊 **Tracks progress** on a live dashboard
4. 🤖 **Agents collaborate** — PM → Dev → Marketing → Analyst
5. ⚡ **Runs autonomously** or step-by-step with your guidance

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, Tailwind CSS v3, Framer Motion, React Flow, Zustand |
| **Backend** | FastAPI, Python 3.11, asyncio, WebSockets |
| **AI Engine** | LangGraph, LangChain, OpenAI GPT-4o |
| **Database** | Supabase (PostgreSQL + Realtime + Auth) |
| **Deployment** | Vercel (frontend) + Railway (backend) |

---

## 🤖 The 4 AI Agents

| Agent | Role |
|---|---|
| 🎯 **Product Manager** | Plans features, prioritizes tasks, manages roadmap |
| 💻 **Developer** | Generates technical specs, code logic, architecture |
| 📣 **Marketing** | Creates campaigns, content, messaging strategy |
| 📊 **Analyst** | Tracks metrics, insights, and recommendations |

All agents share a single OpenAI API key with distinct system prompt roles.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase project
- OpenAI API key

### Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your API keys in .env
pip install -r requirements.txt
python run.py
```

### Frontend Setup
```bash
cd frontend
cp .env.local.example .env.local
# Fill in your Supabase + API keys
npm install
npm run dev
```

### Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL Editor
3. Run the contents of `backend/app/db/schema.sql`

---

## 📁 Project Structure

```
AutoPilot-AI-Workspace/
├── backend/                 # FastAPI + LangGraph AI Engine
│   ├── app/
│   │   ├── agents/          # 4 specialized AI agents
│   │   ├── orchestrator/    # LangGraph multi-agent pipeline
│   │   ├── api/             # REST + WebSocket endpoints
│   │   ├── db/              # Supabase client + schema
│   │   └── models/          # Pydantic schemas
│   └── requirements.txt
├── frontend/                # Next.js 14 App
│   ├── app/                 # App Router pages
│   ├── components/          # UI components
│   └── lib/                 # Supabase, Zustand, WebSocket
└── docs/                    # Submission materials
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

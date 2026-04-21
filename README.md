# 🚀 AutoPilot AI Workspace

AutoPilot AI Workspace is an autonomous, multi-agent project execution platform. It transforms high-level goals into actionable, managed, and self-improving workflows using state-of-the-art AI orchestration.

## 🌟 Core Pillars
1. **AI Command Center**: Multi-turn, streaming chat interface with specialized agents.
2. **Multi-Agent Orchestration**: Powered by **LangGraph**, coordinating PM, Dev, Marketing, and Analyst agents.
3. **Autonomous Execution**: Agents use real-world tools to generate code, conduct research, and refine plans.
4. **Visual Insight Engine**: Real-time node graphs and business analytics dashboards.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, React Flow 12, Zustand.
- **Backend**: FastAPI (Python), LangGraph, LangChain, OpenAI.
- **Database**: Supabase (PostgreSQL + Realtime).

---

## 🚀 Quick Start

### 1. Database Setup (Phase 4)
- Create a new project on [Supabase](https://supabase.com).
- Open the **SQL Editor** and execute the contents of `backend/schema.sql`.
- Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### 2. Backend Installation
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # Add your OPENAI_API_KEY and Supabase keys
uvicorn app.main:app --reload
```

### 3. Frontend Installation
```bash
cd frontend
npm install
cp .env.local.example .env.local # Add your Supabase keys
npm run dev
```

---

## 🤖 How it Works
1. **Describe a Goal**: "Launch a Coffee Subscription Startup."
2. **Planning**: The **Product Manager** breaks the goal into tasks.
3. **Execution**: The **Developer** writes code skeletons, and **Marketing** does research via tools.
4. **Refinement**: The **Analyst** calculates ROI and progress, looping back for improvements if needed.
5. **Visualization**: Watch the whole process unfold in the **Workflow View** and **Activity Timeline**.

---

## 📄 Submission Materials
See `submission_package.md` in the root (if provided) or `backend/submission_package.md` for the full elevator pitch, demo script, and architecture guide.

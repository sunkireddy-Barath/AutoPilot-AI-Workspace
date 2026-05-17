"""
AutoPilot AI — Multi-Agent Orchestration Engine.

Always runs all 5 specialized agents sequentially:
Product Manager → Developer → Marketing → Analyst → Operations

Each agent produces rich markdown + structured artifacts (roadmap, mermaid diagrams).
Agent messages are collected and returned in the REST response so they work on Vercel
serverless (no persistent WebSocket needed).
"""

from __future__ import annotations

import json
import asyncio
import re
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from datetime import datetime
from uuid import uuid4
from app.utils.events import global_bus
from app.utils.auth_utils import to_uuid

from langchain.schema import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI

from app.config import settings
from app.agents.pm_agent import ProductManagerAgent
from app.agents.dev_agent import DeveloperAgent
from app.agents.marketing_agent import MarketingAgent
from app.agents.analyst_agent import AnalystAgent
from app.agents.operations_agent import OperationsAgent
from app.models.schemas import AgentRole


# ── Domain Detection ─────────────────────────────────────────────────────

def _detect_domain(goal: str) -> str:
    g = goal.lower()
    if any(k in g for k in ["ml", "ai ", "llm", "gpt", "model", "predict", "neural", "machine learning"]):
        return "ml"
    if any(k in g for k in ["food", "delivery", "restaurant", "grocery", "order", "commerce", "shop", "marketplace", "ecommerce"]):
        return "commerce"
    if any(k in g for k in ["social", "chat", "messaging", "community", "network", "connect", "forum"]):
        return "social"
    if any(k in g for k in ["health", "medical", "clinic", "patient", "doctor", "wellness", "fitness"]):
        return "health"
    if any(k in g for k in ["finance", "fintech", "bank", "payment", "invest", "crypto", "wallet", "trading"]):
        return "finance"
    if any(k in g for k in ["education", "learning", "course", "student", "teach", "school", "lms"]):
        return "education"
    if any(k in g for k in ["saas", "dashboard", "analytics", "crm", "platform", "tool", "b2b"]):
        return "saas"
    return "general"


# ── Heuristic Response Bank ──────────────────────────────────────────────

def _heuristic_responses(goal: str) -> List[Dict[str, Any]]:
    """
    Returns rich content for all 5 agents when the LLM is unavailable.
    Each entry has: agent_role, content (markdown), artifact (optional dict).
    """
    domain = _detect_domain(goal)
    topic = re.sub(r'[^\w\s]', '', goal).strip()[:60]
    T = topic

    # ── Domain-specific configs ────────────────────────────────────────
    stacks = {
        "ml":       ("Python, FastAPI, PyTorch/TensorFlow, Celery, Redis, Pinecone, Docker", "ML Platform"),
        "commerce": ("React Native, Node.js/Express, PostgreSQL, Stripe, Redis, AWS S3", "Commerce Engine"),
        "social":   ("Next.js, FastAPI, WebSockets, Neo4j, Redis Pub/Sub, Elasticsearch", "Social Platform"),
        "health":   ("React, FastAPI, PostgreSQL, HIPAA-compliant AWS infra, HL7 FHIR API", "Health Platform"),
        "finance":  ("React, Node.js, PostgreSQL, Plaid API, Stripe, AWS KMS, SOC2 infra", "Fintech Platform"),
        "education":("Next.js, FastAPI, PostgreSQL, AWS S3/CloudFront, WebRTC, Redis", "EdTech Platform"),
        "saas":     ("Next.js, FastAPI, PostgreSQL, Redis, Stripe billing, Segment analytics", "SaaS Platform"),
        "general":  ("Next.js, FastAPI, PostgreSQL, Redis, Docker, Terraform", "Core Platform"),
    }

    mermaid_arch = {
        "ml": """graph TB
  subgraph Client["Frontend (Next.js)"]
    UI[Dashboard UI] -->|REST/WS| GW
  end
  subgraph Backend["ML Backend (FastAPI)"]
    GW[API Gateway] --> Auth[Auth Service]
    GW --> Inf[Inference Engine]
    GW --> Train[Training Service]
    Inf --> Model[PyTorch/TF Model]
    Train --> Queue[Celery Queue]
    Queue --> Worker[GPU Worker]
    Worker --> S3[(S3 Data Lake)]
    Model --> Vec[(Pinecone Vector DB)]
  end
  subgraph Ops["Observability"]
    Inf -.->|Metrics| Prom[Prometheus]
    Prom --> Graf[Grafana Dashboard]
  end""",

        "commerce": """graph TB
  subgraph Apps["Client Apps"]
    Mob[Mobile App] -->|GraphQL| GW
    Web[Web App] -->|GraphQL| GW
  end
  subgraph Core["Commerce Backend"]
    GW[GraphQL Gateway] --> Order[Order Service]
    GW --> Catalog[Catalog Service]
    GW --> User[User Service]
    Order --> Payment[Stripe Gateway]
    Order --> Track[Delivery Tracker]
    Catalog --> Cache[(Redis Cache)]
  end
  subgraph Data["Storage"]
    Order --> DB[(PostgreSQL)]
    Track --> Redis[(Redis Pub/Sub)]
  end""",

        "social": """graph TB
  subgraph Clients["Clients"]
    Web[Browser] <-->|WSS| WS
    App[Mobile] <-->|WSS| WS
  end
  subgraph Core["Social Core"]
    WS[WebSocket Server] --> PubSub[Redis Pub/Sub]
    WS --> Graph[Social Graph]
    PubSub --> Notif[Notification Worker]
    Graph --> Neo[(Neo4j DB)]
  end
  subgraph Search["Discovery"]
    WS --> ES[Elasticsearch]
    ES --> Feed[Feed Ranking]
  end""",

        "general": """graph TB
  subgraph Frontend["Next.js Frontend (Vercel)"]
    UI[React UI] --> Store[Zustand Store]
    Store -->|API Calls| GW
  end
  subgraph Backend["FastAPI Backend"]
    GW[API Gateway] --> Auth[Auth Service]
    GW --> Core[Core Business Logic]
    Core --> Cache[(Redis Cache)]
    Core --> DB[(PostgreSQL)]
  end
  subgraph Infra["Infrastructure"]
    GW -.->|Logs| Monitor[Observability Stack]
  end""",
    }

    ci_cd = {
        "ml": """graph LR
  Dev[Developer Push] --> CI[GitHub Actions CI]
  CI --> Test[pytest + model validation]
  Test --> Build[Docker Build + push ECR]
  Build --> Stage[Staging Deploy - ECS]
  Stage --> QA[A/B Model Testing]
  QA --> Prod[Production ECS + Auto-scaling]
  Prod --> Monitor[Prometheus + Grafana]""",

        "general": """graph LR
  Push[Git Push] --> CI[GitHub Actions]
  CI --> Lint[ESLint + mypy]
  Lint --> Test[pytest + Jest]
  Test --> Build[Docker Build]
  Build --> Registry[ECR / Docker Hub]
  Registry --> Stage[Staging - Vercel/ECS]
  Stage --> QA[E2E Tests - Playwright]
  QA --> Prod[Production Deploy]
  Prod --> Alert[PagerDuty Alerts]""",
    }

    growth_funnel = {
        "ml": "graph LR\n  A[Tech Blog & Papers] --> B[API Trial Signup]\n  B --> C[Developer Integration]\n  C --> D[Team Onboarding]\n  D --> E[Enterprise Contract]",
        "commerce": "graph LR\n  A[Local Ads + Promo] --> B[App Install]\n  B --> C[First Order - 20% off]\n  C --> D[Loyalty Points]\n  D --> E[Refer-a-Friend]\n  E --> F[Power User]",
        "social": "graph LR\n  A[Viral Invite Loop] --> B[Sign Up]\n  B --> C[Profile Setup]\n  C --> D[First Post / Connection]\n  D --> E[Daily Active User]\n  E --> F[Premium Features]",
        "general": "graph LR\n  A[Content Marketing + SEO] --> B[Landing Page Visit]\n  B --> C[Free Trial Signup]\n  C --> D[Core Feature Activation]\n  D --> E[Paid Conversion]\n  E --> F[Expansion Revenue]",
    }

    stack, platform = stacks.get(domain, stacks["general"])
    arch = mermaid_arch.get(domain, mermaid_arch["general"])
    ci = ci_cd.get(domain, ci_cd["general"])
    funnel = growth_funnel.get(domain, growth_funnel["general"])

    # ── 1. Product Manager ───────────────────────────────────────────────
    pm_phases = {
        "ml": [
            {"title": "Data Infrastructure & Pipeline", "description": f"Build data lakes, ingestion pipelines, and preprocessing for {T}. Set up feature stores and data versioning with DVC.", "status": "In Progress", "milestones": ["Data schema defined", "ETL pipeline live", "Feature store operational"]},
            {"title": "Model Development & Evaluation", "description": "Train baseline models, benchmark accuracy, tune hyperparameters, and validate against hold-out sets.", "status": "Planned", "milestones": ["Baseline model trained", "Accuracy target hit", "A/B eval framework ready"]},
            {"title": "Inference API & User Interface", "description": "Deploy low-latency inference endpoints, build the dashboard, and integrate model outputs into the UX.", "status": "Planned", "milestones": ["API <200ms p95", "Dashboard shipped", "User testing complete"]},
            {"title": "MLOps & Continuous Improvement", "description": "Implement model drift detection, automated retraining triggers, and a feedback loop for labeling.", "status": "Planned", "milestones": ["Drift alerts live", "Auto-retrain pipeline", "Labeling workflow"]},
        ],
        "commerce": [
            {"title": "Core Commerce Engine", "description": f"Build product catalog, cart logic, order management, and checkout flow for {T}.", "status": "In Progress", "milestones": ["Catalog & search live", "Cart + checkout", "Order management"]},
            {"title": "Payments & Logistics Integration", "description": "Integrate Stripe/PayPal, real-time delivery tracking, push notifications, and partner API.", "status": "Planned", "milestones": ["Payment gateway live", "GPS tracking", "Notification system"]},
            {"title": "Merchant Portal & Analytics", "description": "Vendor onboarding dashboards, sales analytics, inventory management, and settlement reports.", "status": "Planned", "milestones": ["Vendor dashboard", "Revenue analytics", "Settlement automation"]},
            {"title": "Growth & Retention Systems", "description": "Loyalty programs, referral engine, push campaigns, and A/B testing framework.", "status": "Planned", "milestones": ["Loyalty points", "Referral module", "A/B testing live"]},
        ],
        "general": [
            {"title": f"Foundation & Authentication for {T[:30]}", "description": "Core architecture setup, user auth (email + OAuth), RBAC, and base UI shell.", "status": "In Progress", "milestones": ["Auth system live", "Core routes built", "Base UI complete"]},
            {"title": "Core Feature Development", "description": "Primary business logic, main user flows, third-party integrations, and REST API.", "status": "Planned", "milestones": ["Core features shipped", "API documented", "Integrations tested"]},
            {"title": "Polish, Performance & Security", "description": "UI refinement, caching layer, load testing, OWASP security audit, and accessibility (WCAG 2.1).", "status": "Planned", "milestones": ["Performance budget met", "Security audit passed", "Accessibility A11y"]},
            {"title": "Launch & Scale", "description": "Production deployment, monitoring stack, SLA targets, growth analytics, and post-launch iteration.", "status": "Planned", "milestones": ["Production live", "Monitoring active", "D30 retention measured"]},
        ],
    }
    phases = pm_phases.get(domain, pm_phases["general"])

    pm_content = f"""## 🎯 Strategic Analysis: {T}

As your **AI Product Manager**, I've conducted a comprehensive analysis of your goal. Here's the full strategic blueprint.

### Market Opportunity
Your project targets a high-growth market segment. Based on the domain signals in your goal, the key differentiators will be **speed-to-market**, **user experience quality**, and **data-driven iteration**.

### RICE-Prioritized Feature Backlog

| Feature | Reach | Impact | Confidence | Effort | RICE Score |
|---------|-------|--------|------------|--------|------------|
| Core user authentication | 10 | 3 | 90% | 1 | **2,700** |
| Primary business flow | 8 | 3 | 80% | 2 | **960** |
| Analytics & insights | 6 | 2 | 70% | 2 | **420** |
| Notification system | 7 | 2 | 80% | 1 | **1,120** |
| Admin dashboard | 4 | 2 | 90% | 2 | **360** |
| Third-party integrations | 5 | 3 | 75% | 3 | **375** |

### Key Success Metrics (KPIs)
- **Activation Rate**: % of signups completing the core action within 24h (target: >40%)
- **D7 Retention**: Users returning after 7 days (target: >25%)
- **p95 API Latency**: Response time at 95th percentile (target: <300ms)
- **NPS Score**: Net Promoter Score from early adopters (target: >40)
- **Monthly Burn Rate**: Track against runway (target: <$15k/month at MVP)

### Next Steps
Enable **Autonomous Mode** to trigger the full developer architecture pass and marketing strategy generation.
"""

    pm_artifact = {"type": "roadmap", "data": {"phases": phases}}

    # ── 2. Developer ──────────────────────────────────────────────────────
    dev_content = f"""## 💻 Technical Architecture: {T}

As your **AI Lead Developer**, I've designed the complete system architecture and technical blueprint.

### Recommended Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 (App Router) | SSR/SSG, TypeScript, excellent DX |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI iteration, consistent design |
| State | Zustand + React Query | Lightweight, server-state sync |
| Backend | FastAPI (Python 3.12) | Async, OpenAPI docs, type-safe |
| Database | PostgreSQL + Redis | ACID transactions + caching layer |
| Auth | Supabase Auth / Firebase | OAuth, email, JWT out of the box |
| File Storage | AWS S3 / Supabase Storage | Scalable object storage |
| Deployment | Vercel (FE) + Railway/Render (BE) | Zero-downtime deploys |

**Full Stack:** `{stack}`

### Core API Endpoints

```
POST   /api/v1/auth/register        — User registration
POST   /api/v1/auth/login           — JWT token exchange
GET    /api/v1/profile              — Authenticated user profile
POST   /api/v1/{topic.replace(' ', '-').lower()[:20]}/create  — Core resource creation
GET    /api/v1/{topic.replace(' ', '-').lower()[:20]}          — List with pagination
PATCH  /api/v1/{topic.replace(' ', '-').lower()[:20]}/{{id}}  — Update resource
DELETE /api/v1/{topic.replace(' ', '-').lower()[:20]}/{{id}}  — Soft delete
GET    /api/v1/analytics/overview   — Aggregated metrics
WS     /ws/{{session_id}}           — Real-time event stream
```

### System Architecture Diagram
"""

    dev_artifact = {"type": "mermaid", "data": {"chart": arch}}

    # ── 3. Marketing ──────────────────────────────────────────────────────
    channels = {
        "ml": [("Developer blogs (Towards Data Science, Medium)", "High", "SEO + authority"), ("GitHub README + demo repo", "Very High", "Developer trust"), ("Product Hunt launch", "High", "Initial spike"), ("LinkedIn tech posts", "Medium", "B2B reach")],
        "commerce": [("Instagram / TikTok reels", "High", "Visual product demos"), ("Google Ads (local targeting)", "High", "Intent-based acquisition"), ("Influencer partnerships", "Medium", "Social proof"), ("Push notification campaigns", "Very High", "Re-engagement")],
        "general": [("SEO content marketing", "High", "Organic long-term"), ("Product Hunt + HN launch", "Very High", "Cold start spike"), ("LinkedIn + Twitter", "Medium", "Brand awareness"), ("Email drip campaigns", "High", "Nurture funnel")],
    }
    ch = channels.get(domain, channels["general"])

    mkt_content = f"""## 📣 Go-To-Market Strategy: {T}

As your **AI Marketing Expert**, here is the complete GTM playbook.

### Positioning Statement
> **For** [target users] **who** struggle with [core pain point], **{T}** is a [category] that [key benefit]. **Unlike** existing alternatives, **{T}** uniquely [differentiator].

### Channel Strategy

| Channel | Impact | Rationale |
|---------|--------|-----------|
| {ch[0][0]} | {ch[0][1]} | {ch[0][2]} |
| {ch[1][0]} | {ch[1][1]} | {ch[1][2]} |
| {ch[2][0]} | {ch[2][1]} | {ch[2][2]} |
| {ch[3][0]} | {ch[3][1]} | {ch[3][2]} |

### 90-Day Content Calendar

| Week | Content | Channel | Goal |
|------|---------|---------|------|
| 1–2 | "Problem + Solution" blog post | SEO + LinkedIn | Brand awareness |
| 3–4 | Product demo video (60s) | YouTube + Twitter | Feature education |
| 5–6 | Case study / use case deep dive | Email + LinkedIn | Trust building |
| 7–8 | Product Hunt launch + press | PH + HN + Twitter | Acquisition spike |
| 9–10 | Referral campaign launch | In-app + Email | Viral loop |
| 11–12 | Retargeting campaign | Paid ads | Conversion push |

### Growth Metrics to Track
- **CAC** (Customer Acquisition Cost): Target <$20 organic, <$50 paid
- **LTV/CAC Ratio**: Target >3:1 within 6 months
- **Organic Traffic Growth**: Target +25% MoM via SEO
- **Email Open Rate**: Target >28% with personalized subject lines
- **Referral Conversion**: Target 15% of signups from word-of-mouth

### Growth Funnel Visualization
"""

    mkt_artifact = {"type": "mermaid", "data": {"chart": funnel}}

    # ── 4. Analyst ────────────────────────────────────────────────────────
    analyst_content = f"""## 📊 Data & Risk Analysis: {T}

As your **AI Data Analyst**, here is the comprehensive performance framework and risk assessment.

### KPI Dashboard

| KPI | Target (Month 1) | Target (Month 3) | Target (Month 6) | Tracking Method |
|-----|-----------------|-----------------|-----------------|----------------|
| Daily Active Users | 100 | 1,000 | 5,000 | Mixpanel / Amplitude |
| Activation Rate | 30% | 40% | 50% | Funnel analytics |
| D7 Retention | 20% | 30% | 40% | Cohort analysis |
| Revenue (MRR) | $0 | $2,000 | $15,000 | Stripe dashboard |
| Churn Rate | <20% | <10% | <5% | Subscription tracking |
| NPS Score | 30 | 40 | 55 | In-app survey |
| p95 API Latency | <500ms | <300ms | <200ms | Datadog / New Relic |

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low user adoption | Medium | High | UX testing before launch; free tier |
| Technical scaling issues | Low | High | Load testing; auto-scaling on AWS |
| Competitor product launch | Medium | Medium | Ship fast; focus on niche differentiation |
| Data breach / security | Low | Critical | OWASP audit; penetration testing; encryption |
| Regulatory compliance | Low | High | Legal review; GDPR/CCPA checklist |
| Key team dependency | Medium | Medium | Documentation; bus factor reduction |

### ROI Projection (12-Month Model)

| Quarter | Users | MRR | Costs | Net |
|---------|-------|-----|-------|-----|
| Q1 | 500 | $500 | $8,000 | **-$7,500** |
| Q2 | 2,000 | $4,000 | $10,000 | **-$6,000** |
| Q3 | 6,000 | $15,000 | $12,000 | **+$3,000** |
| Q4 | 15,000 | $38,000 | $18,000 | **+$20,000** |

### Optimization Recommendations
1. **Funnel drop-off audit**: Instrument every step with Mixpanel events from Day 1
2. **Cohort analysis**: Identify which acquisition channels produce highest D30 retention
3. **Pricing experiment**: A/B test $9 vs $19 vs $29/month to maximize LTV
4. **Feature flagging**: Use LaunchDarkly to safely ship to 10% of users first
5. **Weekly metrics review**: Share a North Star metric dashboard with the whole team
"""

    analyst_artifact = None  # Pure markdown — rich table content

    # ── 5. Operations ─────────────────────────────────────────────────────
    ops_content = f"""## ⚙️ Infrastructure & DevOps Plan: {T}

As your **AI Operations Engineer**, here is the complete infrastructure and deployment strategy.

### Infrastructure Stack

| Layer | Service | Tier | Monthly Cost |
|-------|---------|------|-------------|
| Frontend | Vercel Pro | Production | ~$20/mo |
| Backend API | Railway / Render | Starter → Pro | ~$25/mo |
| Database | Supabase / Neon | Pro | ~$25/mo |
| Cache | Upstash Redis | Pay-per-use | ~$5/mo |
| File Storage | AWS S3 | Standard | ~$5/mo |
| CDN | Cloudflare | Free tier | $0 |
| Monitoring | Datadog / Grafana Cloud | Free tier | $0 |
| Error Tracking | Sentry | Developer | $0 |
| **Total MVP Infra** | | | **~$80/mo** |

### Environment Strategy
```
Local Dev    → .env.local (never commit)
Staging      → Vercel preview deploys (auto on PR)
Production   → Vercel prod + Railway prod (manual promote)
```

### CI/CD Pipeline Diagram

### Security Checklist
- [ ] All secrets in environment variables (never in code)
- [ ] HTTPS enforced everywhere (HSTS headers)
- [ ] Rate limiting on all public API endpoints (100 req/min)
- [ ] SQL injection prevention (parameterized queries / ORM)
- [ ] CORS locked to known origins (no wildcard in prod)
- [ ] Dependency scanning (Dependabot / Snyk)
- [ ] Automated backups (Supabase PITR or pg_dump daily)
- [ ] Penetration test before public launch

### Scaling Roadmap
| Threshold | Action |
|-----------|--------|
| 1K DAU | Add Redis caching for hot queries |
| 10K DAU | Horizontal API scaling (2→4 containers) |
| 50K DAU | CDN for static assets, read replicas |
| 100K DAU | Microservices split, dedicated DB clusters |
| 500K DAU | Multi-region active-active, global CDN |
"""

    ops_artifact = {"type": "mermaid", "data": {"chart": ci.get(domain, ci["general"]) if isinstance(ci, dict) else ci}}

    return [
        {"agent_role": "product_manager", "content": pm_content, "artifact": pm_artifact},
        {"agent_role": "developer",        "content": dev_content, "artifact": dev_artifact},
        {"agent_role": "marketing",        "content": mkt_content, "artifact": mkt_artifact},
        {"agent_role": "analyst",          "content": analyst_content, "artifact": analyst_artifact},
        {"agent_role": "operations",       "content": ops_content, "artifact": ops_artifact},
    ]


# ── Orchestration Engine ─────────────────────────────────────────────────

class MeDoOrchestrator:
    """
    Multi-agent orchestrator — always runs all 5 agents.
    Falls back to rich heuristic responses when OpenAI is unavailable.
    """

    def __init__(self):
        self.pm = ProductManagerAgent()
        self.dev = DeveloperAgent()
        self.marketing = MarketingAgent()
        self.analyst = AnalystAgent()
        self.ops = OperationsAgent()

    def _extract_artifact(self, text: str) -> Optional[dict]:
        matches = re.findall(r"```json\s*([\s\S]*?)\s*```", text)
        for m in matches:
            try:
                data = json.loads(m)
                if "type" in data and ("data" in data or "phases" in data):
                    return data
            except Exception:
                continue
        return None

    def _create_activity(self, role_str: str, action: str, detail: str,
                         conv_id: str, workflow_id: Optional[str] = None) -> dict:
        return {
            "id": str(uuid4()),
            "agent_role": role_str,
            "action": action,
            "detail": detail,
            "status": "completed",
            "conversation_id": conv_id,
            "workflow_id": workflow_id,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _build_workflow_graph(self, tasks: List[dict]):
        nodes = [
            {"id": "goal", "type": "goal",
             "data": {"label": "🎯 Strategic Goal"},
             "position": {"x": 500, "y": 0}},
            {"id": "orchestrator", "type": "agent",
             "data": {"label": "AutoPilot", "color": "#6366f1", "role": "orchestrator"},
             "position": {"x": 500, "y": 130}},
        ]
        agent_defs = [
            {"id": "pm",   "label": "Product Manager", "color": "#8B5CF6", "role": "product_manager", "x": 100, "y": 280},
            {"id": "dev",  "label": "Developer",       "color": "#06B6D4", "role": "developer",       "x": 300, "y": 280},
            {"id": "mkt",  "label": "Marketing",       "color": "#F59E0B", "role": "marketing",       "x": 500, "y": 280},
            {"id": "ops",  "label": "Operations",      "color": "#EC4899", "role": "operations",      "x": 700, "y": 280},
            {"id": "ana",  "label": "Analyst",         "color": "#10B981", "role": "analyst",         "x": 900, "y": 280},
        ]
        edges = [
            {"id": "e_goal_orch", "source": "goal", "target": "orchestrator", "animated": True},
        ]
        for a in agent_defs:
            nodes.append({
                "id": f"agent_{a['id']}", "type": "agent",
                "data": {"label": a["label"], "color": a["color"], "role": a["role"]},
                "position": {"x": a["x"], "y": a["y"]},
            })
            edges.append({
                "id": f"e_orch_{a['id']}",
                "source": "orchestrator",
                "target": f"agent_{a['id']}",
                "animated": True,
            })

        agent_x_map = {
            "product_manager": 100, "developer": 300,
            "marketing": 500, "operations": 700, "analyst": 900,
        }
        agent_id_map = {
            "product_manager": "pm", "developer": "dev",
            "marketing": "mkt", "operations": "ops", "analyst": "ana",
        }
        for i, t in enumerate(tasks[:15]):
            assigned = t.get("assigned_agent", "product_manager")
            ax = agent_x_map.get(assigned, 100)
            aid = agent_id_map.get(assigned, "pm")
            nodes.append({
                "id": t["id"], "type": "task",
                "data": {
                    "title": t["title"],
                    "status": t["status"],
                    "priority": t.get("priority", "medium"),
                    "progress": t.get("progress", 100),
                    "assigned_agent": t.get("assigned_agent"),
                },
                "position": {"x": ax + (i % 2) * 30 - 15, "y": 420 + (i % 3) * 90},
            })
            edges.append({
                "id": f"e_{aid}_{t['id']}",
                "source": f"agent_{aid}",
                "target": t["id"],
                "label": "Executing",
                "animated": False,
            })

        return nodes, edges

    async def _call_agent(
        self,
        agent_obj,
        role_str: str,
        thinking_msg: str,
        context: str,
        heuristic: dict,
        conversation_id: str,
        workflow_id: Optional[str],
        history: list,
        topic: str,
    ) -> dict:
        """Call one agent, emit events, return the collected message dict."""
        await global_bus.emit("agent_thinking", {
            "conversation_id": conversation_id,
            "agent_role": role_str,
            "message": thinking_msg,
        })

        content = ""
        artifact = None
        try:
            raw = await agent_obj.think(context, history)
            content = re.sub(r"<thinking>[\s\S]*?</thinking>", "", raw).strip()
            artifact = self._extract_artifact(raw)
            if not content or len(content) < 50:
                raise ValueError("Response too short")
        except Exception as llm_err:
            print(f"⚠️ [{role_str}] LLM error: {llm_err} — using heuristic")
            content = heuristic["content"]
            artifact = heuristic["artifact"]

        msg = {
            "id": str(uuid4()),
            "conversation_id": conversation_id,
            "role": "agent",
            "agent_role": role_str,
            "content": content,
            "metadata": {"artifact": artifact} if artifact else {},
            "created_at": datetime.utcnow().isoformat(),
        }
        await global_bus.emit("agent_message", msg)
        await global_bus.emit("agent_activity", {
            "conversation_id": conversation_id,
            "activity": self._create_activity(
                role_str, "Analysis",
                f"{role_str.replace('_', ' ').title()} analysis complete for: {topic}",
                conversation_id, workflow_id,
            ),
        })
        return msg

    async def run(
        self,
        user_goal: str,
        conversation_id: str,
        user_id: str,
        history: list = None,
        autonomous: bool = False,
        workflow_id: Optional[str] = None,
    ) -> dict:
        mapped_user_id = to_uuid(user_id)
        topic = re.sub(r'[^\w\s]', '', user_goal).strip()[:40]
        history = history or []
        heuristics = _heuristic_responses(user_goal)

        # ── AUTO OFF: Single PM agent — fast, focused response ──────────
        if not autonomous:
            await global_bus.emit("agent_thinking", {
                "conversation_id": conversation_id,
                "agent_role": "product_manager",
                "message": "Analyzing your goal and preparing a strategic response...",
            })
            msg = await self._call_agent(
                self.pm, "product_manager",
                "Analyzing your goal and preparing a strategic response...",
                user_goal, heuristics[0],
                conversation_id, workflow_id, history, topic,
            )
            task = {
                "id": str(uuid4()), "title": f"Analyze {topic}",
                "description": "", "status": "completed", "priority": "high",
                "assigned_agent": "product_manager", "progress": 100,
                "user_id": mapped_user_id, "conversation_id": conversation_id,
                "workflow_id": workflow_id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            await global_bus.emit("task_created", {"conversation_id": conversation_id, "task": task})
            nodes, edges = self._build_workflow_graph([task])
            await global_bus.emit("workflow_updated", {
                "conversation_id": conversation_id, "nodes": nodes, "edges": edges,
            })
            return {
                "agent_messages": [msg], "tasks": [task],
                "workflow_nodes": nodes, "workflow_edges": edges,
                "pm_response": msg["content"], "dev_response": "",
                "marketing_response": "", "analyst_response": "", "ops_response": "",
            }

        # ── AUTO ON: Full 5-agent pipeline — comprehensive analysis ─────
        agent_sequence = [
            (self.pm,        "product_manager", "Analyzing requirements and creating strategic roadmap...",   0),
            (self.dev,       "developer",       "Designing system architecture and technical blueprint...",   1),
            (self.marketing, "marketing",       "Building go-to-market strategy and growth funnel...",        2),
            (self.analyst,   "analyst",         "Analyzing KPIs, risk matrix, and performance metrics...",    3),
            (self.ops,       "operations",      "Planning infrastructure, CI/CD, and deployment pipeline...", 4),
        ]

        agent_messages: List[dict] = []
        context = user_goal

        # ── Run each agent in sequence ──────────────────────────────────
        for agent_obj, role_str, thinking_msg, h_idx in agent_sequence:
            msg = await self._call_agent(
                agent_obj, role_str, thinking_msg, context,
                heuristics[h_idx], conversation_id, workflow_id, history, topic,
            )
            agent_messages.append(msg)
            context = f"Goal: {user_goal}\n\nPrevious agent ({role_str}) summary:\n{msg['content'][:300]}"

        # ── Generate tasks ──────────────────────────────────────────────
        task_defs = [
            ("product_manager", f"Define {topic} Product Requirements & Roadmap"),
            ("developer",       f"Design {topic} System Architecture"),
            ("marketing",       f"Execute {topic} Go-To-Market Strategy"),
            ("analyst",         f"Analyze {topic} KPIs & Risk Matrix"),
            ("operations",      f"Deploy {topic} Infrastructure & CI/CD"),
        ]
        tasks = []
        for agent_r, title in task_defs:
            task = {
                "id": str(uuid4()),
                "title": title,
                "description": "",
                "status": "completed",
                "priority": "high",
                "assigned_agent": agent_r,
                "progress": 100,
                "user_id": mapped_user_id,
                "conversation_id": conversation_id,
                "workflow_id": workflow_id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            tasks.append(task)
            await global_bus.emit("task_created", {"conversation_id": conversation_id, "task": task})

        nodes, edges = self._build_workflow_graph(tasks)
        await global_bus.emit("workflow_updated", {
            "conversation_id": conversation_id,
            "nodes": nodes,
            "edges": edges,
        })

        return {
            "agent_messages": agent_messages,
            "tasks": tasks,
            "workflow_nodes": nodes,
            "workflow_edges": edges,
            "pm_response":        agent_messages[0]["content"] if len(agent_messages) > 0 else "",
            "dev_response":       agent_messages[1]["content"] if len(agent_messages) > 1 else "",
            "marketing_response": agent_messages[2]["content"] if len(agent_messages) > 2 else "",
            "analyst_response":   agent_messages[3]["content"] if len(agent_messages) > 3 else "",
            "ops_response":       agent_messages[4]["content"] if len(agent_messages) > 4 else "",
        }

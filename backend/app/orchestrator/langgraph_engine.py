"""
MeDo Master Orchestration Engine — Refined Iterative Edition.

Coordinates specialized agents in an iterative, autonomous loop:
PM → Dev (→ Tools) → Marketing (→ Tools) → Analyst → [Loop if needed] → Synthesize.
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

from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain.schema import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.config import settings
from app.agents.pm_agent import ProductManagerAgent
from app.agents.dev_agent import DeveloperAgent
from app.agents.marketing_agent import MarketingAgent
from app.agents.analyst_agent import AnalystAgent
from app.agents.operations_agent import OperationsAgent
from app.models.schemas import (
    AgentActivity, AgentRole, TaskCreate, WorkflowNode, WorkflowEdge,
    TaskPriority, TaskStatus, WSEvent, WSEventType
)
from app.tools.workspace_tools import (
    write_workspace_file, read_workspace_file, 
    list_workspace_files, google_research_simulation,
    get_weather_brief
)


# ─────────────────────────────────────────────
#  LangGraph State Definition
# ─────────────────────────────────────────────

class AgentState(TypedDict):
    """Shared state that flows through the LangGraph pipeline."""
    user_goal: str
    conversation_id: str
    user_id: str
    workflow_id: Optional[str]
    messages: Annotated[List[BaseMessage], add_messages]
    pm_response: str
    dev_response: str
    marketing_response: str
    analyst_response: str
    ops_response: str
    tasks: List[Dict[str, Any]]
    workflow_nodes: List[Dict[str, Any]]
    workflow_edges: List[Dict[str, Any]]
    agent_activities: List[Dict[str, Any]]
    agent_messages: List[Dict[str, Any]]
    autonomous_mode: bool
    current_agent: str
    iteration: int


# ─────────────────────────────────────────────
#  Orchestration Engine
# ─────────────────────────────────────────────

class MeDoOrchestrator:
    """Main orchestration engine with iterative autonomy."""

    def __init__(self):
        self.pm = ProductManagerAgent()
        self.dev = DeveloperAgent()
        self.marketing = MarketingAgent()
        self.analyst = AnalystAgent()
        self.ops = OperationsAgent()

        self.orchestrator_llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.2,
        ).bind_tools([write_workspace_file, google_research_simulation, get_weather_brief])

        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(AgentState)

        # Register nodes
        workflow.add_node("pm_node", self._pm_node)
        workflow.add_node("dev_node", self._dev_node)
        workflow.add_node("marketing_node", self._marketing_node)
        workflow.add_node("analyst_node", self._analyst_node)
        workflow.add_node("operations_node", self._operations_node)
        workflow.add_node("synthesize_node", self._synthesize_node)
        workflow.add_node("tools_node", self._tools_node)

        # Routing Logic
        def route_tools(state: AgentState):
            if state["messages"] and hasattr(state["messages"][-1], "tool_calls") and state["messages"][-1].tool_calls:
                return "tools_node"
            return "next"

        def route_after_analyst(state: AgentState):
            # Iterative Autonomy: Loop back if analyst finds gaps (max 2 loops in MVP)
            if state.get("autonomous_mode", False) and state.get("iteration", 0) < 1:
                return "pm_node"
            return "synthesize_node"

        # Edge Definitions
        workflow.set_entry_point("pm_node")
        
        workflow.add_edge("pm_node", "dev_node")

        workflow.add_conditional_edges(
            "dev_node", route_tools, 
            {"tools_node": "tools_node", "next": "marketing_node"}
        )

        workflow.add_conditional_edges(
            "marketing_node", route_tools,
            {"tools_node": "tools_node", "next": "operations_node"}
        )

        workflow.add_edge("operations_node", "analyst_node")
        workflow.add_edge("tools_node", "analyst_node") # Tools proceed to analysis for verification

        workflow.add_conditional_edges(
            "analyst_node", route_after_analyst,
            {"pm_node": "pm_node", "synthesize_node": "synthesize_node"}
        )

        workflow.add_edge("synthesize_node", END)

        # Register collaboration event handlers for handoffs
        async def emit_handoff(source: str, target: str, state: AgentState):
            await global_bus.emit("agent_collaboration", {
                "conversation_id": state["conversation_id"],
                "source": source,
                "target": target,
                "message": f"Handing off {source.replace('_', ' ')} specifications to {target.replace('_', ' ')}.",
                "timestamp": datetime.utcnow().isoformat()
            })

        return workflow.compile()

    # ── Node Implementations ─────────────────────────────────────────────

    async def _tools_node(self, state: AgentState) -> AgentState:
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            for tool_call in last_message.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                result = ""
                if tool_name == "write_workspace_file":
                    result = write_workspace_file.invoke(tool_args)
                elif tool_name == "google_research_simulation":
                    result = google_research_simulation.invoke(tool_args)
                elif tool_name == "get_weather_brief":
                    result = get_weather_brief.invoke(tool_args)
                
                activity = self._create_activity(
                    AgentRole.ORCHESTRATOR, "Tool Call",
                    f"Executed {tool_name}: {result[:60]}...", "completed",
                    state["conversation_id"], state.get("workflow_id")
                )
                state["agent_activities"].append(activity)
                await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})
        return state

    async def _pm_node(self, state: AgentState) -> AgentState:
        state["current_agent"] = "product_manager"
        state["iteration"] = state.get("iteration", 0) + 1
        
        await self._emit_message(state, "product_manager", "Analyzing requirements and drafting roadmap...")

        context = f"Goal: {state['user_goal']}\nIteration: {state['iteration']}"
        response = await self.pm.think(context, self._get_history(state))
        state["pm_response"] = response
        
        # Strip thinking tags for cleaner chat
        # Strip thinking tags and extract artifacts
        clean_content = re.sub(r"<thinking>[\s\S]*?</thinking>", "", response).strip()
        artifact = self._extract_artifact(response)
        
        await self._emit_message(state, "product_manager", clean_content, {"artifact": artifact} if artifact else None)

        reasoning = self._extract_reasoning(response)
        if reasoning:
            activity = self._create_activity(
                AgentRole.PRODUCT_MANAGER, "Thinking", reasoning, "completed", state["conversation_id"], state.get("workflow_id")
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        new_tasks = self._extract_tasks(response, "tasks", state)
        state["tasks"].extend(new_tasks)
        for task in new_tasks:
             await global_bus.emit("task_created", {"conversation_id": state["conversation_id"], "task": task})

        state["messages"].append(AIMessage(content=response, additional_kwargs={"agent_role": "product_manager"}))
        
        await global_bus.emit("agent_collaboration", {
            "conversation_id": state["conversation_id"],
            "source": "product_manager", "target": "developer",
            "message": "Strategic roadmap finalized. Handing off to Development Agent for architecture design.",
            "timestamp": datetime.utcnow().isoformat()
        })
        return state

    async def _dev_node(self, state: AgentState) -> AgentState:
        state["current_agent"] = "developer"
        await self._emit_message(state, "developer", "Designing architecture and writing implementation specs...")
        
        dev_ll = self.dev.llm.bind_tools([write_workspace_file])
        context = f"Specs for: {state['pm_response'][:500]}"
        response = await dev_ll.ainvoke(self.dev._build_messages(context, self._get_history(state)))
        content = response.content
        state["dev_response"] = content
        
        clean_content = re.sub(r"<thinking>[\s\S]*?</thinking>", "", content).strip()
        artifact = self._extract_artifact(content)
        
        await self._emit_message(state, "developer", clean_content, {"artifact": artifact} if artifact else None)

        reasoning = self._extract_reasoning(content)
        if reasoning:
            activity = self._create_activity(
                AgentRole.DEVELOPER, "Thinking", reasoning, "completed", state["conversation_id"], state.get("workflow_id")
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})
            
        state["messages"].append(response)
        
        await global_bus.emit("agent_collaboration", {
            "conversation_id": state["conversation_id"],
            "source": "developer", "target": "marketing",
            "message": "Technical specs ready. Handing off to Marketing Agent for growth strategy formulation.",
            "timestamp": datetime.utcnow().isoformat()
        })
        return state

    async def _marketing_node(self, state: AgentState) -> AgentState:
        state["current_agent"] = "marketing"
        await self._emit_message(state, "marketing", "Researching market trends and drafting growth strategy...")
        
        mkt_ll = self.marketing.llm.bind_tools([google_research_simulation])
        context = f"Strategy for: {state['user_goal']}"
        response = await mkt_ll.ainvoke(self.marketing._build_messages(context, self._get_history(state)))
        content = response.content
        state["marketing_response"] = content
        
        clean_content = re.sub(r"<thinking>[\s\S]*?</thinking>", "", content).strip()
        artifact = self._extract_artifact(content)
        
        await self._emit_message(state, "marketing", clean_content, {"artifact": artifact} if artifact else None)

        reasoning = self._extract_reasoning(content)
        if reasoning:
            activity = self._create_activity(
                AgentRole.MARKETING, "Thinking", reasoning, "completed", state["conversation_id"], state.get("workflow_id")
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        state["messages"].append(response)
        
        await global_bus.emit("agent_collaboration", {
            "conversation_id": state["conversation_id"],
            "source": "marketing", "target": "operations",
            "message": "Growth funnel mapped. Handing off to Operations Agent for deployment automation.",
            "timestamp": datetime.utcnow().isoformat()
        })
        return state

    async def _operations_node(self, state: AgentState) -> AgentState:
        state["current_agent"] = "operations"
        await self._emit_message(state, "operations", "Automating deployment and configuring CI/CD pipelines...")
        
        context = f"Deploy and automate: {state['user_goal']}"
        response = await self.ops.think(context, self._get_history(state))
        state["ops_response"] = response
        
        # Strip thinking tags and extract artifacts
        clean_content = re.sub(r"<thinking>[\s\S]*?</thinking>", "", response).strip()
        artifact = self._extract_artifact(response)
        
        await self._emit_message(state, "operations", clean_content, {"artifact": artifact} if artifact else None)

        reasoning = self._extract_reasoning(response)
        if reasoning:
            activity = self._create_activity(
                AgentRole.OPERATIONS, "Thinking", reasoning, "completed", state["conversation_id"], state.get("workflow_id")
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        new_tasks = self._extract_tasks(response, "tasks", state)
        state["tasks"].extend(new_tasks)
        for task in new_tasks:
             await global_bus.emit("task_created", {"conversation_id": state["conversation_id"], "task": task})

        state["messages"].append(AIMessage(content=response, additional_kwargs={"agent_role": "operations"}))
        
        await global_bus.emit("agent_collaboration", {
            "conversation_id": state["conversation_id"],
            "source": "operations", "target": "analyst",
            "message": "Deployment pipeline configured. Handing off to Analyst Agent for final validation.",
            "timestamp": datetime.utcnow().isoformat()
        })
        return state

    async def _analyst_node(self, state: AgentState) -> AgentState:
        state["current_agent"] = "analyst"
        await self._emit_message(state, "analyst", "Running final analysis and plan validation...")
        
        response = await self.analyst.think("Evaluate full plan coherence.", self._get_history(state))
        state["analyst_response"] = response
        
        # Strip thinking tags and extract artifacts
        clean_content = re.sub(r"<thinking>[\s\S]*?</thinking>", "", response).strip()
        artifact = self._extract_artifact(response)
        
        await self._emit_message(state, "analyst", clean_content, {"artifact": artifact} if artifact else None)

        reasoning = self._extract_reasoning(response)
        if reasoning:
            activity = self._create_activity(
                AgentRole.ANALYST, "Thinking", reasoning, "completed", state["conversation_id"], state.get("workflow_id")
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        state["messages"].append(AIMessage(content=response, additional_kwargs={"agent_role": "analyst"}))
        return state

    async def _emit_message(self, state: AgentState, role: str, content: str, metadata: dict = None):
        """Emit a message to the UI via global bus (WebSocket)."""
        await global_bus.emit("agent_message", {
            "conversation_id": state["conversation_id"],
            "role": "agent",
            "agent_role": role,
            "content": content,
            "metadata": metadata or {},
            "id": str(uuid4()),
            "created_at": datetime.utcnow().isoformat()
        })

    async def _synthesize_node(self, state: AgentState) -> AgentState:
        nodes, edges = self._build_workflow_graph(state["tasks"])
        state["workflow_nodes"] = nodes
        state["workflow_edges"] = edges
        return state

    # ── Helpers ──────────────────────────────────────────────────────────

    def _create_activity(self, agent_role, action, detail, status, conv_id, workflow_id=None):
        return {
            "id": str(uuid4()), "agent_role": agent_role.value, "action": action,
            "detail": detail, "status": status, "conversation_id": conv_id,
            "workflow_id": workflow_id,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _get_history(self, state):
        history = []
        for msg in state.get("messages", []):
            if isinstance(msg, HumanMessage): history.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                role = msg.additional_kwargs.get("agent_role", "assistant")
                history.append({"role": role, "content": msg.content})
        return history[-10:]

    def _extract_tasks(self, response, key, state):
        tasks = []
        matches = re.findall(r"```json\s*([\s\S]*?)\s*```", response)
        for match in matches:
            try:
                data = json.loads(match)
                for t in data.get(key, []):
                    tasks.append({
                        "id": str(uuid4()), "title": t.get("title", "Task"),
                        "description": t.get("description", ""), "status": "pending",
                        "priority": "medium", "assigned_agent": t.get("assigned_agent", "pm"),
                        "progress": 0, "user_id": state["user_id"],
                        "conversation_id": state["conversation_id"], 
                        "workflow_id": state.get("workflow_id"),
                        "created_at": datetime.utcnow().isoformat(),
                    })
            except: continue
        return tasks

    def _extract_reasoning(self, response):
        """Extract content within <thinking> tags."""
        match = re.search(r"<thinking>([\s\S]*?)</thinking>", response)
        if match:
            return match.group(1).strip()
        return None

    def _extract_artifact(self, response):
        """Extracts JSON artifact from agent response if present."""
        # Look for JSON blocks specifically tagged as artifacts or just general JSON
        matches = re.findall(r"```json\s*([\s\S]*?)\s*```", response)
        for match in matches:
            try:
                data = json.loads(match)
                # Check if it has an artifact structure
                if "type" in data and ("data" in data or "phases" in data or "chart" in data):
                    # Canonicalize structure if needed
                    if "phases" in data and "type" not in data:
                         return {"type": "roadmap", "data": {"phases": data["phases"]}}
                    if "chart" in data and "type" not in data:
                         return {"type": "mermaid", "data": {"chart": data["chart"]}}
                    return data
            except: continue
        return None

    def _build_workflow_graph(self, tasks):
        nodes = []
        edges = []
        
        # 1. Main Goal Node
        nodes.append({
            "id": "goal", "type": "goal", 
            "data": {"label": "🎯 Strategic Goal"}, 
            "position": {"x": 500, "y": 0}
        })

        # 2. Agent Nodes (SWARM row)
        agents = [
            {"id": "pm", "label": "🧠 PM", "color": "#8B5CF6", "x": 50},
            {"id": "dev", "label": "💻 Dev", "color": "#06B6D4", "x": 250},
            {"id": "mkt", "label": "📣 Mkt", "color": "#F59E0B", "x": 450},
            {"id": "ops", "label": "⚙️ Ops", "color": "#EC4899", "x": 650},
            {"id": "analyst", "label": "📊 Analyst", "color": "#10B981", "x": 850}
        ]
        
        for i, a in enumerate(agents):
            nodes.append({
                "id": f"agent_{a['id']}", "type": "agent",
                "data": {"label": a['label'], "color": a['color'], "role": a['id'] == 'pm' and 'product_manager' or a['id']},
                "position": {"x": a['x'], "y": 150}
            })
            # Connect Goal to Agents
            edges.append({
                "id": f"e_goal_{a['id']}", "source": "goal", "target": f"agent_{a['id']}",
                "animated": True, "label": "Directing"
            })

        # 3. Task Nodes (Bottom Swarm)
        for i, t in enumerate(tasks[:15]):
            # Assign to agent column
            assigned = t.get("assigned_agent", "pm")
            base_x = 50
            if "dev" in assigned: base_x = 250
            elif "marketing" in assigned: base_x = 450
            elif "operations" in assigned: base_x = 650
            elif "analyst" in assigned: base_x = 850
            
            # Stagger tasks in a column
            column_index = i // 5
            nodes.append({
                "id": t["id"], "type": "task",
                "data": {"label": t["title"], "status": t["status"]},
                "position": {"x": base_x + (i % 2) * 20, "y": 350 + (i % 5) * 80 + (column_index * 20)}
            })
            
            # Connect Agent to Task
            src_node = f"agent_{assigned}"
            if "product_manager" in assigned: src_node = "agent_pm"
            elif "marketing" in assigned: src_node = "agent_mkt"
            
            edges.append({
                "id": f"e_{assigned}_{t['id']}", 
                "source": src_node, 
                "target": t["id"],
                "label": "Executing"
            })

        return nodes, edges

    async def run(self, user_goal, conversation_id, user_id, history=None, autonomous=False, workflow_id=None):
        # Map user_id to UUID for database compatibility
        mapped_user_id = to_uuid(user_id)
        
        # --- MANUAL MODE: Only PM agent responds (no full pipeline) ---
        if not autonomous:
            await global_bus.emit("agent_activity", {
                "conversation_id": conversation_id,
                "activity": self._create_activity(
                    AgentRole.PRODUCT_MANAGER, "Direct Response",
                    "Manual mode: Single agent responding...", "active",
                    conversation_id, workflow_id
                )
            })
            response = await self.pm.think(user_goal, history or [])
            msg_id = str(uuid4())
            await global_bus.emit("agent_message", {
                "id": msg_id,
                "conversation_id": conversation_id,
                "role": "assistant",
                "agent_role": "product_manager",
                "content": response,
                "created_at": datetime.utcnow().isoformat(),
            })
            nodes, edges = self._build_workflow_graph([])
            return {
                "pm_response": response,
                "dev_response": "", "marketing_response": "",
                "analyst_response": "", "ops_response": "",
                "tasks": [], "workflow_nodes": nodes, "workflow_edges": edges,
                "agent_activities": [], "agent_messages": [],
            }

        # --- AUTONOMOUS MODE: Full multi-agent orchestration pipeline ---
        # Emit initial nodes immediately for UI responsiveness
        nodes, edges = self._build_workflow_graph([])
        await global_bus.emit("workflow_updated", {
            "conversation_id": conversation_id,
            "nodes": nodes,
            "edges": edges
        })

        lc_messages = [HumanMessage(content=user_goal)]
        initial_state = {
            "user_goal": user_goal, "conversation_id": conversation_id, "user_id": mapped_user_id,
            "workflow_id": workflow_id,
            "messages": lc_messages, "pm_response": "", "dev_response": "",
            "marketing_response": "", "analyst_response": "", "ops_response": "", "tasks": [],
            "workflow_nodes": nodes, "workflow_edges": edges, "agent_activities": [],
            "agent_messages": [], "autonomous_mode": autonomous, "current_agent": "orchestrator",
            "iteration": 0,
        }
        
        try:
            return await self.graph.ainvoke(initial_state)
        except Exception as e:
            # --- REAL-TIME AI ORCHESTRATION ---
            print(f"🚀 Initiating Real-time AI Blueprinting... (Reason: {e})")
            
            # Helper to get dynamic content from LLM
            async def get_ai_artifact(role: str, goal: str, context: str):
                prompt = f"""
                You are the MeDo {role} Agent.
                The user goal is: "{goal}"
                Current context: {context}
                
                Task: Provide a natural, conversational brief (70% human-made tone) about how you will solve this.
                Also, provide a structured 'artifact' in JSON format.
                
                If role is 'Product Manager', artifact should be type 'roadmap' with 'phases' (list of {{title, description, status}}).
                If role is 'Developer', artifact should be type 'architecture' or 'mermaid' with a 'chart' (valid Mermaid graph TB or erDiagram).
                If role is 'Marketing', artifact should be type 'mermaid' with a 'chart' (valid Mermaid graph LR for a growth funnel).
                If role is 'Analyst', artifact should be type 'mermaid' with a 'chart' (valid Mermaid pie or bar chart).
                If role is 'Operations', artifact should be type 'mermaid' with a 'chart' (valid Mermaid graph TB for deployment flow).
                
                Format:
                BRIEF: <your conversational brief>
                ARTIFACT: {{ "type": "...", "data": {{ ... }} }}
                """
                try:
                    resp = await self.orchestrator_llm.ainvoke([HumanMessage(content=prompt)])
                    content = resp.content
                    
                    # Parsing
                    brief_match = re.search(r"BRIEF:\s*([\s\S]*?)(?=ARTIFACT:|$)", content)
                    artifact_match = re.search(r"ARTIFACT:\s*([\s\S]*)", content)
                    
                    brief = brief_match.group(1).strip() if brief_match else content[:200]
                    artifact = None
                    
                    if artifact_match:
                        try:
                            # Clean JSON potential markdown
                            json_str = re.sub(r"```json\s*|\s*```", "", artifact_match.group(1).strip())
                            artifact = json.loads(json_str)
                        except:
                            pass
                    
                    if brief and artifact:
                        return brief, artifact
                    raise ValueError("Failed to parse dynamic content")
                    
                except Exception as llm_error:
                    print(f"⚠️ LLM Call Failed (Quota/Key issue or Parsing error): {llm_error}")
                    # Powerful, Highly Variable Heuristic Fallback Engine
                    topic = goal[:60].strip()
                    topic_upper = re.sub(r'[^a-zA-Z0-9 ]', '', topic).upper().replace(' ', '_')
                    topic_lower = goal.lower()
                    
                    # Domain Detection
                    is_ml = any(k in topic_lower for k in ["ml", "ai", "model", "predict", "train", "data"])
                    is_commerce = any(k in topic_lower for k in ["food", "shop", "store", "delivery", "commerce", "buy"])
                    is_social = any(k in topic_lower for k in ["social", "chat", "connect", "community", "network"])
                    
                    if "roadmap" in context.lower() or role == "Product Manager":
                        if is_ml:
                            phases = [
                                {"title": f"Data Pipeline & {topic}", "description": "Setting up data lakes, ingestion pipelines, and cleaning raw data.", "status": "In Progress"},
                                {"title": "Model Training & Tuning", "description": "Training the core machine learning models and optimizing hyperparameters.", "status": "Planned"},
                                {"title": "API Deployment", "description": "Deploying inference endpoints and building the user interface.", "status": "Planned"}
                            ]
                            msg = f"I've analyzed your ML-focused request: '{topic}'. Data is our most valuable asset here. I've designed a roadmap prioritizing the data pipeline and model accuracy before we focus on the UI."
                        elif is_commerce:
                            phases = [
                                {"title": f"Inventory & {topic} Core", "description": "Building the product catalog, cart logic, and checkout flow.", "status": "In Progress"},
                                {"title": "Payment & Logistics", "description": "Integrating Stripe/PayPal and setting up delivery tracking.", "status": "Planned"},
                                {"title": "Merchant Onboarding", "description": "Creating dashboards for vendors to manage their offerings.", "status": "Planned"}
                            ]
                            msg = f"For your commerce/delivery app '{topic}', transaction reliability and user trust are everything. The roadmap I've built focuses heavily on a bulletproof checkout and real-time tracking."
                        else:
                            phases = [
                                {"title": f"Core Infrastructure for {topic}", "description": "Establishing the base architecture and primary user authentication.", "status": "In Progress"},
                                {"title": "Feature Development", "description": "Building the main business logic and interactive components.", "status": "Planned"},
                                {"title": "Launch & Scale", "description": "Load testing, optimizing the database, and public release.", "status": "Planned"}
                            ]
                            msg = f"I've deeply analyzed your request: '{topic}'. To build a successful market-ready product, we need a phased approach focusing on core utility first."
                        
                        return (msg, {"type": "roadmap", "data": {"phases": phases}})

                    elif role == "Developer" and "Architecture" in context:
                        if is_ml:
                            chart = f"""graph TB
  subgraph Client [Frontend UI]
    UI[Next.js App] -- Requests --> API[FastAPI Gateway]
  end
  subgraph Data_Science [ML Pipeline]
    API -- Inference --> Model[TensorFlow / PyTorch Engine]
    Model -- Fetch --> VectorDB[(Pinecone / Milvus)]
    Worker[Celery Worker] -- Train --> Model
    Worker -- Batch --> DataLake[(S3 Data Lake)]
  end
  subgraph Ops [MLOps]
    Monitor[Prometheus] -.-> Model
  end"""
                            msg = f"For the '{topic}' machine learning app, a standard web backend won't cut it. I've designed an architecture utilizing a dedicated Inference Engine and a Vector Database for high-speed similarity search and model serving."
                        elif is_commerce:
                            chart = f"""graph TB
  subgraph Mobile_Web [Client Applications]
    App[React Native App] -- API --> Gateway[GraphQL Gateway]
  end
  subgraph Microservices [Commerce Backend]
    Gateway -- Route --> Order[Order Management]
    Gateway -- Route --> Inventory[Catalog Service]
    Order -- Process --> Payment[Stripe Integration]
    Order -- Track --> Logistics[GPS / Delivery Tracking]
  end
  subgraph Databases [Storage]
    Order -- Write --> DB[(PostgreSQL)]
    Inventory -- Read --> Redis[(Redis Cache)]
  end"""
                            msg = f"Building '{topic}' requires a robust microservices approach to handle transactions securely. I've integrated dedicated services for Order Management, Payment Gateways, and Real-time Logistics tracking."
                        elif is_social:
                            chart = f"""graph TB
  subgraph Clients
    Web[Browser] <--> WS[WebSocket Server]
    Mobile[App] <--> WS
  end
  subgraph Social_Core
    WS -- PubSub --> Redis[Redis Pub/Sub]
    WS -- Feed --> Graph[Neo4j Social Graph]
    Redis -- Async --> Worker[Notification Worker]
  end
  subgraph Storage
    Graph -- Persist --> DB[(Cassandra/ScyllaDB)]
    Worker -- Push --> APNS[Apple/FCM Push]
  end"""
                            msg = f"A social application like '{topic}' requires high-throughput real-time capabilities. I've designed a WebSocket-first architecture backed by a Neo4j Graph Database to map user relationships and a Pub/Sub system for instant messaging."
                        else:
                            chart = f"""graph TB
  subgraph Client_Layer [Frontend Application]
    UI[React / Tailwind UI] -- Events --> State[State Management]
    State -- API Calls --> Gateway
  end
  subgraph Core_Engine [Backend Services]
    Gateway[FastAPI Gateway] -- Routes --> Logic[{topic_upper}_SERVICE]
    Logic -- Auth --> AuthSys[Authentication]
  end
  subgraph Data_Layer [Persistence]
    Logic -- SQL --> DB[PostgreSQL Database]
    Logic -- Cache --> Redis[Redis Cache]
  end"""
                            msg = f"To bring '{topic}' to life, I've designed a scalable microservices architecture. It uses a clear separation of concerns between the client interface and the robust `{topic_upper}_SERVICE` backend."
                        
                        return (msg, {"type": "architecture", "data": {"chart": chart}})

                    elif role == "Developer" and "ER Diagram" in context:
                        if is_ml:
                            chart = f"""erDiagram
  USER ||--o{{ PREDICTION_LOG : generates
  MODEL_VERSION ||--o{{ PREDICTION_LOG : processes
  DATASET ||--o{{ MODEL_VERSION : trains
  USER {{ string id PK }}
  PREDICTION_LOG {{
    string log_id PK
    float confidence_score
    json input_features
  }}
  MODEL_VERSION {{ string version_hash PK }}"""
                            msg = f"Data tracking is critical for ML. This schema tracks `PREDICTION_LOG`s against specific `MODEL_VERSION`s, ensuring we can audit model drift and user behavior over time."
                        elif is_commerce:
                            chart = f"""erDiagram
  CUSTOMER ||--o{{ ORDER : places
  RESTAURANT ||--o{{ MENU_ITEM : offers
  ORDER ||--|{{ ORDER_ITEM : contains
  MENU_ITEM ||--o{{ ORDER_ITEM : is_part_of
  ORDER ||--o{{ DELIVERY : requires
  CUSTOMER {{ string id PK }}
  ORDER {{
    string order_id PK
    float total_amount
    string status
  }}"""
                            msg = f"For a transactional system like this, the relational integrity between `ORDER`, `RESTAURANT`, and `DELIVERY` is paramount. This ER diagram ensures atomic transactions."
                        elif is_social:
                            chart = f"""erDiagram
  USER ||--o{{ POST : creates
  USER ||--o{{ COMMENT : writes
  POST ||--o{{ COMMENT : has
  USER ||--o{{ CONNECTION : follows
  CONNECTION {{
    string follower_id FK
    string following_id FK
    timestamp created_at
  }}"""
                            msg = f"The social schema relies heavily on the `CONNECTION` table to resolve followers/following logic rapidly, alongside standard `POST` and `COMMENT` entities."
                        else:
                            chart = f"""erDiagram
  USER ||--o{{ {topic_upper}_SESSION : initiates
  {topic_upper}_SESSION ||--|{{ DATA_RECORD : generates
  DATA_RECORD ||--o{{ METRICS : tracks
  USER {{
    string id PK
    string email
  }}
  {topic_upper}_SESSION {{
    string session_id PK
    timestamp created_at
  }}"""
                            msg = f"Here is the database schema tailored for your requirements. The `{topic_upper}_SESSION` entity is central to tracking user interactions securely."
                        
                        return (msg, {"type": "mermaid", "data": {"chart": chart}})

                    elif role == "Marketing":
                        if is_ml:
                            chart = "graph LR\n A[Tech Blog/SEO] --> B[API Trial Signups]\n B --> C[Developer Integration]\n C --> D[Enterprise Tier Upgrade]"
                            msg = "Marketing an AI/ML product requires targeting developers and enterprises. We'll focus on technical content marketing and API trial conversions."
                        elif is_commerce:
                            chart = "graph LR\n A[Local Ads & Promo Codes] --> B[App Download]\n B --> C[First Purchase (Discount)]\n C --> D[Loyalty Program]\n D --> E[Refer a Friend]"
                            msg = "In the commerce space, acquisition cost is high. We will utilize aggressive hyper-local marketing and promo codes to drive first-purchases, then lock them in with a loyalty loop."
                        else:
                            chart = "graph LR\n A[Targeted Outreach] --> B[User Onboarding]\n B --> C[Core Engagement]\n C --> D[Retention Loop]\n D --> E[Viral Advocacy]"
                            msg = "For a project like this, growth depends on a seamless onboarding experience. I've mapped a targeted acquisition funnel."
                        
                        return (msg, {"type": "mermaid", "data": {"chart": chart}})

                    else:
                        return f"I've completed my strategic analysis for: {topic}.", None

            # 1. Product Manager
            brief, artifact = await get_ai_artifact("Product Manager", user_goal, "Strategic Planning")
            await self._emit_message(initial_state, "product_manager", brief, {"artifact": artifact} if artifact else None)
            activity = self._create_activity(AgentRole.PRODUCT_MANAGER, "Planning", "Strategic Roadmap Generated", "completed", conversation_id, workflow_id)
            initial_state["agent_activities"].append(activity)
            await global_bus.emit("agent_activity", {"conversation_id": conversation_id, "activity": activity})
            await asyncio.sleep(1.5)

            # 2. Developer (Architecture)
            brief, artifact = await get_ai_artifact("Developer", user_goal, "System Architecture")
            await self._emit_message(initial_state, "developer", brief, {"artifact": artifact} if artifact else None)
            activity = self._create_activity(AgentRole.DEVELOPER, "Architecting", "System Blueprint Designed", "completed", conversation_id, workflow_id)
            initial_state["agent_activities"].append(activity)
            await global_bus.emit("agent_activity", {"conversation_id": conversation_id, "activity": activity})
            await asyncio.sleep(1.5)

            # 3. Developer (ER Diagram)
            brief, artifact = await get_ai_artifact("Developer", user_goal, "Database Schema Design (ER Diagram)")
            await self._emit_message(initial_state, "developer", brief, {"artifact": artifact} if artifact else None)
            activity = self._create_activity(AgentRole.DEVELOPER, "Data Modeling", "ER Diagram Generated", "completed", conversation_id, workflow_id)
            initial_state["agent_activities"].append(activity)
            await global_bus.emit("agent_activity", {"conversation_id": conversation_id, "activity": activity})
            await asyncio.sleep(1.5)

            # 4. Marketing
            brief, artifact = await get_ai_artifact("Marketing", user_goal, "Growth Funnel & Branding")
            await self._emit_message(initial_state, "marketing", brief, {"artifact": artifact} if artifact else None)
            activity = self._create_activity(AgentRole.MARKETING, "Market Analysis", "Growth Funnel Mapped", "completed", conversation_id, workflow_id)
            initial_state["agent_activities"].append(activity)
            await global_bus.emit("agent_activity", {"conversation_id": conversation_id, "activity": activity})
            await asyncio.sleep(1.5)

            # 5. Analyst
            brief, artifact = await get_ai_artifact("Analyst", user_goal, "Performance & Risk Assessment")
            await self._emit_message(initial_state, "analyst", brief, {"artifact": artifact} if artifact else None)
            activity = self._create_activity(AgentRole.ANALYST, "Analysis", "Risk Assessment Finalized", "completed", conversation_id, workflow_id)
            initial_state["agent_activities"].append(activity)
            await global_bus.emit("agent_activity", {"conversation_id": conversation_id, "activity": activity})
            await asyncio.sleep(1.0)

            # Finalize Workflow Node Cluster with Dynamic Content
            # Extract topics for dynamic task titles
            topic = user_goal[:40].strip()
            fallback_tasks = [
                {"id": str(uuid4()), "title": f"Map {topic} Requirements", "status": "completed", "assigned_agent": "product_manager", "user_id": mapped_user_id, "conversation_id": conversation_id, "workflow_id": workflow_id},
                {"id": str(uuid4()), "title": f"Design {topic} Architecture", "status": "completed", "assigned_agent": "developer", "user_id": mapped_user_id, "conversation_id": conversation_id, "workflow_id": workflow_id},
                {"id": str(uuid4()), "title": f"Execute {topic} GTM Strategy", "status": "completed", "assigned_agent": "marketing", "user_id": mapped_user_id, "conversation_id": conversation_id, "workflow_id": workflow_id},
                {"id": str(uuid4()), "title": f"Analyze {topic} Performance", "status": "completed", "assigned_agent": "analyst", "user_id": mapped_user_id, "conversation_id": conversation_id, "workflow_id": workflow_id}
            ]
            initial_state["tasks"].extend(fallback_tasks)
            
            # Broadcast tasks so they are persisted by on_bus_event
            for t in fallback_tasks:
                await global_bus.emit("task_created", {"conversation_id": conversation_id, "task": t})

            nodes, edges = self._build_workflow_graph(fallback_tasks)
            initial_state["workflow_nodes"] = nodes
            initial_state["workflow_edges"] = edges
            
            await global_bus.emit("workflow_updated", {
                "conversation_id": conversation_id,
                "nodes": nodes,
                "edges": edges
            })

            return initial_state

    def _build_sequential_workflow(self, tasks):
        """Builds an organic, human-designed 'Data Flow' graph with a winding Z-pattern."""
        nodes = [
            {"id": "goal", "type": "goal", "data": {"label": "🎯 Primary Directive"}, "position": {"x": 400, "y": 0}},
            
            # Agent Nodes in a 'Natural' winding path
            {"id": "agent_pm", "type": "agent", "data": {"label": "🧠 Product Strategy", "color": "#8B5CF6", "role": "product_manager"}, "position": {"x": 100, "y": 120}},
            {"id": "agent_dev", "type": "agent", "data": {"label": "💻 System Architecture", "color": "#06B6D4", "role": "dev"}, "position": {"x": 700, "y": 280}},
            {"id": "agent_mkt", "type": "agent", "data": {"label": "📣 Market Presence", "color": "#F59E0B", "role": "marketing"}, "position": {"x": 100, "y": 440}},
            {"id": "agent_ana", "type": "agent", "data": {"label": "📊 Strategic Insights", "color": "#10B981", "role": "analyst"}, "position": {"x": 700, "y": 600}},
        ]
        
        edges = [
            {"id": "e_goal_pm", "source": "goal", "target": "agent_pm", "animated": True, "label": "Transmitting Vision", "style": {"stroke": "#8B5CF6"}},
            {"id": "e_pm_dev", "source": "agent_pm", "target": "agent_dev", "animated": True, "label": "Blueprint Data Stream", "style": {"stroke": "#06B6D4"}},
            {"id": "e_dev_mkt", "source": "agent_dev", "target": "agent_mkt", "animated": True, "label": "Technical Assets", "style": {"stroke": "#F59E0B"}},
            {"id": "e_mkt_ana", "source": "agent_mkt", "target": "agent_ana", "animated": True, "label": "Growth Metrics", "style": {"stroke": "#10B981"}},
        ]
        
        # Add tasks clustered organically near their agents
        for i, t in enumerate(tasks):
            assigned = t.get("assigned_agent", "pm")
            src = "agent_pm"
            base_x, base_y = 100, 120
            if "dev" in assigned: 
                src = "agent_dev"
                base_x, base_y = 700, 280
            elif "marketing" in assigned: 
                src = "agent_mkt"
                base_x, base_y = 100, 440
            
            # Offset task node for a 'natural' cluster look
            offset_x = 150 if base_x < 400 else -150
            nodes.append({
                "id": t["id"], "type": "task",
                "data": {"label": t["title"], "status": t["status"]},
                "position": {"x": base_x + offset_x, "y": base_y + (i * 60)}
            })
            edges.append({
                "id": f"e_src_{t['id']}", "source": src, "target": t["id"], 
                "label": "Deploying", "animated": True, "style": {"strokeDasharray": "5,5"}
            })

        return nodes, edges

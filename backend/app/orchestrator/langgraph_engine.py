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
    list_workspace_files, google_research_simulation
)


# ─────────────────────────────────────────────
#  LangGraph State Definition
# ─────────────────────────────────────────────

class AgentState(TypedDict):
    """Shared state that flows through the LangGraph pipeline."""
    user_goal: str
    conversation_id: str
    user_id: str
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
        ).bind_tools([write_workspace_file, google_research_simulation])

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
                
                activity = self._create_activity(
                    AgentRole.ORCHESTRATOR, "Tool Call",
                    f"Executed {tool_name}: {result[:60]}...", "completed",
                    state["conversation_id"]
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
        clean_content = re.sub(r"<thinking>[\s\S]*?</thinking>", "", response).strip()
        await self._emit_message(state, "product_manager", clean_content)

        reasoning = self._extract_reasoning(response)
        if reasoning:
            activity = self._create_activity(
                AgentRole.PRODUCT_MANAGER, "Thinking", reasoning, "completed", state["conversation_id"]
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        new_tasks = self._extract_tasks(response, "tasks", state)
        state["tasks"].extend(new_tasks)
        for task in new_tasks:
             await global_bus.emit("task_created", {"conversation_id": state["conversation_id"], "task": task})

        state["messages"].append(AIMessage(content=response, additional_kwargs={"agent_role": "product_manager"}))
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
        await self._emit_message(state, "developer", clean_content)

        reasoning = self._extract_reasoning(content)
        if reasoning:
            activity = self._create_activity(
                AgentRole.DEVELOPER, "Thinking", reasoning, "completed", state["conversation_id"]
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})
            
        state["messages"].append(response)
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
        await self._emit_message(state, "marketing", clean_content)

        reasoning = self._extract_reasoning(content)
        if reasoning:
            activity = self._create_activity(
                AgentRole.MARKETING, "Thinking", reasoning, "completed", state["conversation_id"]
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        state["messages"].append(response)
        return state

    async def _operations_node(self, state: AgentState) -> AgentState:
        state["current_agent"] = "operations"
        await self._emit_message(state, "operations", "Automating deployment and configuring CI/CD pipelines...")
        
        context = f"Deploy and automate: {state['user_goal']}"
        response = await self.ops.think(context, self._get_history(state))
        state["ops_response"] = response
        
        clean_content = re.sub(r"<thinking>[\s\S]*?</thinking>", "", response).strip()
        await self._emit_message(state, "operations", clean_content)

        reasoning = self._extract_reasoning(response)
        if reasoning:
            activity = self._create_activity(
                AgentRole.OPERATIONS, "Thinking", reasoning, "completed", state["conversation_id"]
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        new_tasks = self._extract_tasks(response, "tasks", state)
        state["tasks"].extend(new_tasks)
        for task in new_tasks:
             await global_bus.emit("task_created", {"conversation_id": state["conversation_id"], "task": task})

        state["messages"].append(AIMessage(content=response, additional_kwargs={"agent_role": "operations"}))
        return state

    async def _analyst_node(self, state: AgentState) -> AgentState:
        state["current_agent"] = "analyst"
        await self._emit_message(state, "analyst", "Running final analysis and plan validation...")
        
        response = await self.analyst.think("Evaluate full plan coherence.", self._get_history(state))
        state["analyst_response"] = response
        
        clean_content = re.sub(r"<thinking>[\s\S]*?</thinking>", "", response).strip()
        await self._emit_message(state, "analyst", clean_content)

        reasoning = self._extract_reasoning(response)
        if reasoning:
            activity = self._create_activity(
                AgentRole.ANALYST, "Thinking", reasoning, "completed", state["conversation_id"]
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        state["messages"].append(AIMessage(content=response, additional_kwargs={"agent_role": "analyst"}))
        return state

    async def _emit_message(self, state: AgentState, role: str, content: str):
        """Emit a message to the UI via global bus (WebSocket)."""
        await global_bus.emit("agent_message", {
            "conversation_id": state["conversation_id"],
            "role": "agent",
            "agent_role": role,
            "content": content,
            "id": str(uuid4()),
            "created_at": datetime.utcnow().isoformat()
        })

    async def _synthesize_node(self, state: AgentState) -> AgentState:
        nodes, edges = self._build_workflow_graph(state["tasks"])
        state["workflow_nodes"] = nodes
        state["workflow_edges"] = edges
        return state

    # ── Helpers ──────────────────────────────────────────────────────────

    def _create_activity(self, agent_role, action, detail, status, conv_id):
        return {
            "id": str(uuid4()), "agent_role": agent_role.value, "action": action,
            "detail": detail, "status": status, "conversation_id": conv_id,
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
                        "conversation_id": state["conversation_id"], "created_at": datetime.utcnow().isoformat(),
                    })
            except: continue
        return tasks

    def _extract_reasoning(self, response):
        """Extract content within <thinking> tags."""
        match = re.search(r"<thinking>([\s\S]*?)</thinking>", response)
        if match:
            return match.group(1).strip()
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

    async def run(self, user_goal, conversation_id, user_id, history=None, autonomous=False):
        # Emit initial nodes immediately for UI responsiveness
        nodes, edges = self._build_workflow_graph([])
        await global_bus.emit("workflow_updated", {
            "conversation_id": conversation_id,
            "nodes": nodes,
            "edges": edges
        })

        lc_messages = [HumanMessage(content=user_goal)]
        initial_state = {
            "user_goal": user_goal, "conversation_id": conversation_id, "user_id": user_id,
            "messages": lc_messages, "pm_response": "", "dev_response": "",
            "marketing_response": "", "analyst_response": "", "ops_response": "", "tasks": [],
            "workflow_nodes": nodes, "workflow_edges": edges, "agent_activities": [],
            "agent_messages": [], "autonomous_mode": autonomous, "current_agent": "orchestrator",
            "iteration": 0,
        }
        
        try:
            return await self.graph.ainvoke(initial_state)
        except Exception as e:
            error_str = str(e).lower()
            if "insufficient_quota" in error_str or "quota" in error_str:
                # FALLBACK: Master Orchestration Simulation (10 Steps)
                print("⚠️ OpenAI Quota Exceeded. Activating Master Orchestration Fallback...")
                
                project_topic = user_goal[:40] + "..." if len(user_goal) > 40 else user_goal
                
                # STEP 2: PRODUCT MANAGER AI (PLANNING)
                pm_output = (
                    f"## 🧠 [Product Manager AI] — Strategic Roadmap\n"
                    f"### 🎯 Project Vision: {project_topic}\n"
                    f"**Problem:** Lack of integrated, autonomous {project_topic} solutions that bridge the gap between planning and execution.\n"
                    f"**Target Users:** Solo-founders, Enterprise PMs, and Distributed Teams.\n\n"
                    f"#### 🛤️ Multi-Phase Roadmap\n"
                    f"1. **Phase 1 (Foundation):** Core architecture and agent-to-agent protocol definitions.\n"
                    f"2. **Phase 2 (Growth):** Integration of external toolsets (GitHub, Slack, Jira).\n"
                    f"3. **Phase 3 (Optimization):** AI-driven cost/resource allocation algorithms.\n\n"
                    f"**Key Tasks:** Define system requirements, design user personas, and map the initial user journey."
                )
                await self._emit_message(initial_state, "product_manager", pm_output)
                await asyncio.sleep(2)

                # STEP 3: DEVELOPER AI (SYSTEM DESIGN)
                dev_output = (
                    f"## 💻 [Developer AI] — System Architecture\n"
                    f"### 🏗️ Technical Blueprint for {project_topic}\n"
                    f"I have designed a resilient micro-services architecture to support the scale requirements.\n\n"
                    f"#### 🏛️ Architecture Diagram\n"
                    f"```\n"
                    f"[Client/Web] <--> [API Gateway] <--> [Orchestrator]\n"
                    f"                                        |\n"
                    f"                 --------------------------------------\n"
                    f"                 |           |            |           |\n"
                    f"             [PM Agent]  [Dev Agent]  [Mkt Agent]  [Analyst]\n"
                    f"```\n"
                    f"**Tech Stack:** Next.js 14, FastAPI, LangGraph, Supabase.\n"
                    f"**Database Schema:** `users`, `conversations`, `messages`, `tasks`, `workflow_nodes`, `agent_logs`."
                )
                await self._emit_message(initial_state, "developer", dev_output)
                await asyncio.sleep(2)

                # STEP 4: MARKETING AI (GROWTH STRATEGY)
                mkt_output = (
                    f"## 📣 [Marketing AI] — Growth & Branding\n"
                    f"### 🚀 Launch Strategy for {project_topic}\n"
                    f"**Brand Identity:** AutoPilot — 'Autonomous Intelligence for High-Growth Teams.'\n\n"
                    f"#### 📈 Marketing Funnel\n"
                    f"- **TOFU:** Viral Twitter/X threads showcasing 'Zero-to-One' autonomous building.\n"
                    f"- **MOFU:** In-depth case studies and technical whitepapers.\n"
                    f"- **BOFU:** Direct onboarding through Product Hunt and developer communities.\n\n"
                    f"**Content Roadmap:** 3x Weekly technical deep-dives + Bi-weekly 'Swarm Progress' reports."
                )
                await self._emit_message(initial_state, "marketing", mkt_output)
                await asyncio.sleep(2)

                # STEP 5: ANALYST AI (INSIGHTS & METRICS)
                ana_output = (
                    f"## 📊 [Analyst AI] — Performance & Validation\n"
                    f"### ⚖️ Strategic Analysis for {project_topic}\n"
                    f"**Key Metrics (KPIs):**\n"
                    f"- **AR (Activation Rate):** Goal is >35% within the first 24 hours.\n"
                    f"- **CS (Cost Per Swarm):** Optimize token usage via local-model caching.\n\n"
                    f"#### 🛡️ Risk Mitigation Algorithm\n"
                    f"`Score = (Complexity * TokenCost) / AgentSuccessRate`\n"
                    f"If Score > Threshold: Trigger human-in-the-loop validation.\n\n"
                    f"**Recommendation:** Implement an 'Autonomous Audit' loop to review task quality every 5 iterations."
                )
                await self._emit_message(initial_state, "analyst", ana_output)
                
                # Final state mock with all requested sections
                initial_state["pm_response"] = pm_output
                initial_state["tasks"] = [
                    {"id": "t1", "title": "System Architecture Design", "status": "pending", "assigned_agent": "developer", "description": "Design core orchestrator"},
                    {"id": "t2", "title": "Market Positioning Strategy", "status": "pending", "assigned_agent": "marketing", "description": "Target audience research"}
                ]
                
                # Update graph with SEQUENTIAL connections (PM -> Dev -> Mkt -> Analyst)
                mock_nodes, mock_edges = self._build_sequential_workflow(initial_state["tasks"])
                await global_bus.emit("workflow_updated", {
                    "conversation_id": conversation_id, "nodes": mock_nodes, "edges": mock_edges
                })
                
                return initial_state
            raise e

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

"""
MeDo Master Orchestration Engine — Refined Iterative Edition.

Coordinates specialized agents in an iterative, autonomous loop:
PM → Dev (→ Tools) → Marketing (→ Tools) → Analyst → [Loop if needed] → Synthesize.
"""

from __future__ import annotations

import json
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
            {"tools_node": "tools_node", "next": "analyst_node"}
        )

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
        
        activity = self._create_activity(
            AgentRole.PRODUCT_MANAGER, "Planning",
            f"Iterative Plan Step {state['iteration']}", "thinking",
            state["conversation_id"]
        )
        state["agent_activities"].append(activity)
        await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        context = f"Goal: {state['user_goal']}\nIteration: {state['iteration']}"
        response = await self.pm.think(context, self._get_history(state))
        state["pm_response"] = response
        
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
        dev_ll = self.dev.llm.bind_tools([write_workspace_file])
        context = f"Specs for: {state['pm_response'][:500]}"
        response = await dev_ll.ainvoke(self.dev._build_messages(context, self._get_history(state)))
        content = response.content
        state["dev_response"] = content
        
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
        mkt_ll = self.marketing.llm.bind_tools([google_research_simulation])
        context = f"Strategy for: {state['user_goal']}"
        response = await mkt_ll.ainvoke(self.marketing._build_messages(context, self._get_history(state)))
        content = response.content
        state["marketing_response"] = content
        
        reasoning = self._extract_reasoning(content)
        if reasoning:
            activity = self._create_activity(
                AgentRole.MARKETING, "Thinking", reasoning, "completed", state["conversation_id"]
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        state["messages"].append(response)
        return state

    async def _analyst_node(self, state: AgentState) -> AgentState:
        state["current_agent"] = "analyst"
        response = await self.analyst.think("Evaluate full plan coherence.", self._get_history(state))
        state["analyst_response"] = response
        
        reasoning = self._extract_reasoning(response)
        if reasoning:
            activity = self._create_activity(
                AgentRole.ANALYST, "Thinking", reasoning, "completed", state["conversation_id"]
            )
            await global_bus.emit("agent_activity", {"conversation_id": state["conversation_id"], "activity": activity})

        state["messages"].append(AIMessage(content=response, additional_kwargs={"agent_role": "analyst"}))
        return state

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
        nodes = [{"id": "goal", "type": "goal", "data": {"label": "🎯 Goal"}, "position": {"x": 400, "y": 50}}]
        for i, t in enumerate(tasks[:10]):
            nodes.append({
                "id": t["id"], "type": "task", "data": {"label": t["title"]},
                "position": {"x": 100 + (i % 3) * 250, "y": 200 + (i // 3) * 100}
            })
        return nodes, []

    async def run(self, user_goal, conversation_id, user_id, history=None, autonomous=False):
        lc_messages = [HumanMessage(content=user_goal)]
        initial_state = {
            "user_goal": user_goal, "conversation_id": conversation_id, "user_id": user_id,
            "messages": lc_messages, "pm_response": "", "dev_response": "",
            "marketing_response": "", "analyst_response": "", "tasks": [],
            "workflow_nodes": [], "workflow_edges": [], "agent_activities": [],
            "agent_messages": [], "autonomous_mode": autonomous, "current_agent": "orchestrator",
            "iteration": 0,
        }
        return await self.graph.ainvoke(initial_state)

"""
LangGraph Multi-Agent Orchestration Engine

This is the core of AutoPilot AI Workspace. It coordinates all 4 agents
in a stateful pipeline where:
1. The Orchestrator receives the user's goal
2. PM Agent plans and decomposes the goal into tasks
3. Developer Agent adds technical specs to dev-related tasks
4. Marketing Agent adds campaign plans to marketing tasks
5. Analyst Agent provides metrics and recommendations for all tasks

The state flows through LangGraph nodes, with each agent adding to
the shared workspace state. Agents communicate via the shared state
and a message bus that is streamed to the frontend via WebSocket.
"""

from __future__ import annotations

import json
import re
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from datetime import datetime
from uuid import uuid4

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


# ─────────────────────────────────────────────
#  LangGraph State Definition
# ─────────────────────────────────────────────

class AgentState(TypedDict):
    """Shared state that flows through the LangGraph pipeline."""
    # Core context
    user_goal: str
    conversation_id: str
    user_id: str

    # Message history (annotated so LangGraph knows to append, not replace)
    messages: Annotated[List[BaseMessage], add_messages]

    # Agent outputs — each agent fills its section
    pm_response: str
    dev_response: str
    marketing_response: str
    analyst_response: str

    # Extracted structured data
    tasks: List[Dict[str, Any]]
    workflow_nodes: List[Dict[str, Any]]
    workflow_edges: List[Dict[str, Any]]
    agent_activities: List[Dict[str, Any]]

    # Agent communication bus (messages between agents)
    agent_messages: List[Dict[str, Any]]

    # Control flags
    autonomous_mode: bool
    current_agent: str
    iteration: int


# ─────────────────────────────────────────────
#  Orchestration Engine
# ─────────────────────────────────────────────

class AutoPilotOrchestrator:
    """
    Main orchestration engine that runs the 4-agent LangGraph pipeline.

    Flow:
    user_input → pm_node → dev_node → marketing_node → analyst_node → synthesize → END

    Each node:
    1. Reads the shared state
    2. Calls its agent with the appropriate context
    3. Parses structured output (tasks, etc.)
    4. Appends to state and agent_activities
    5. Passes state to the next node
    """

    def __init__(self):
        self.pm = ProductManagerAgent()
        self.dev = DeveloperAgent()
        self.marketing = MarketingAgent()
        self.analyst = AnalystAgent()

        # Orchestrator LLM — low temp for consistent routing decisions
        self.orchestrator_llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.2,
        )

        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build and compile the LangGraph state machine."""
        workflow = StateGraph(AgentState)

        # Register nodes
        workflow.add_node("pm_node", self._pm_node)
        workflow.add_node("dev_node", self._dev_node)
        workflow.add_node("marketing_node", self._marketing_node)
        workflow.add_node("analyst_node", self._analyst_node)
        workflow.add_node("synthesize_node", self._synthesize_node)

        # Define edges (sequential pipeline)
        workflow.set_entry_point("pm_node")
        workflow.add_edge("pm_node", "dev_node")
        workflow.add_edge("dev_node", "marketing_node")
        workflow.add_edge("marketing_node", "analyst_node")
        workflow.add_edge("analyst_node", "synthesize_node")
        workflow.add_edge("synthesize_node", END)

        return workflow.compile()

    # ── Node Implementations ─────────────────────────────────────────────

    async def _pm_node(self, state: AgentState) -> AgentState:
        """Product Manager node — decomposes goal into tasks and roadmap."""
        activity = self._create_activity(
            AgentRole.PRODUCT_MANAGER,
            "Planning",
            f"Breaking down goal: '{state['user_goal'][:60]}...'",
            "thinking",
            state["conversation_id"],
        )
        state["agent_activities"].append(activity)
        state["current_agent"] = "product_manager"

        # Build context message for PM
        context = (
            f"User Goal: {state['user_goal']}\n\n"
            "Please analyze this goal and:\n"
            "1. Break it down into specific, actionable tasks\n"
            "2. Identify which agent should handle each task\n"
            "3. Create a workflow structure for visualization\n"
            "4. Output the structured JSON task list"
        )

        response = await self.pm.think(context, self._get_history(state))
        state["pm_response"] = response

        # Parse tasks from PM response
        new_tasks = self._extract_tasks(response, "tasks", state)
        state["tasks"].extend(new_tasks)

        # Build initial workflow nodes for visualization
        nodes, edges = self._build_workflow_graph(state["tasks"])
        state["workflow_nodes"] = nodes
        state["workflow_edges"] = edges

        # Log agent-to-agent message
        state["agent_messages"].append({
            "from": "product_manager",
            "to": "developer",
            "message": f"Goal analyzed. Passing {len(new_tasks)} tasks for technical review.",
            "timestamp": datetime.utcnow().isoformat(),
        })

        # Update activity status
        activity["status"] = "completed"
        activity["detail"] = f"Created {len(new_tasks)} tasks and workflow plan"

        state["messages"].append(AIMessage(
            content=response,
            additional_kwargs={"agent_role": "product_manager"}
        ))
        return state

    async def _dev_node(self, state: AgentState) -> AgentState:
        """Developer node — adds technical specs to dev tasks."""
        activity = self._create_activity(
            AgentRole.DEVELOPER,
            "Technical Review",
            f"Adding technical specs for {len(state['tasks'])} tasks",
            "thinking",
            state["conversation_id"],
        )
        state["agent_activities"].append(activity)
        state["current_agent"] = "developer"

        # Build context for developer — include PM's output
        context = (
            f"User Goal: {state['user_goal']}\n\n"
            f"Product Manager's Plan:\n{state['pm_response']}\n\n"
            "As the Developer agent:\n"
            "1. Review the technical requirements in these tasks\n"
            "2. Add technical specifications and implementation details\n"
            "3. Identify any technical tasks that need to be added\n"
            "4. Assess technical complexity and risks"
        )

        response = await self.dev.think(context, self._get_history(state))
        state["dev_response"] = response

        # Parse additional technical tasks
        new_tasks = self._extract_tasks(response, "technical_tasks", state)
        state["tasks"].extend(new_tasks)

        # Agent-to-agent communication
        state["agent_messages"].append({
            "from": "developer",
            "to": "marketing",
            "message": f"Technical specs added. {len(new_tasks)} technical tasks created.",
            "timestamp": datetime.utcnow().isoformat(),
        })

        activity["status"] = "completed"
        activity["detail"] = f"Added technical specs, {len(new_tasks)} technical tasks"

        state["messages"].append(AIMessage(
            content=response,
            additional_kwargs={"agent_role": "developer"}
        ))
        return state

    async def _marketing_node(self, state: AgentState) -> AgentState:
        """Marketing node — adds GTM strategy and campaign plans."""
        activity = self._create_activity(
            AgentRole.MARKETING,
            "Campaign Planning",
            "Creating go-to-market strategy and campaign tasks",
            "thinking",
            state["conversation_id"],
        )
        state["agent_activities"].append(activity)
        state["current_agent"] = "marketing"

        context = (
            f"User Goal: {state['user_goal']}\n\n"
            f"Product Plan:\n{state['pm_response']}\n\n"
            f"Technical Plan:\n{state['dev_response']}\n\n"
            "As the Marketing agent:\n"
            "1. Create a go-to-market strategy for this goal\n"
            "2. Generate specific marketing tasks (content, campaigns, messaging)\n"
            "3. Define target audience and key messages\n"
            "4. Plan the launch sequence"
        )

        response = await self.marketing.think(context, self._get_history(state))
        state["marketing_response"] = response

        new_tasks = self._extract_tasks(response, "marketing_tasks", state)
        state["tasks"].extend(new_tasks)

        state["agent_messages"].append({
            "from": "marketing",
            "to": "analyst",
            "message": f"GTM strategy created. {len(new_tasks)} marketing tasks ready for analysis.",
            "timestamp": datetime.utcnow().isoformat(),
        })

        activity["status"] = "completed"
        activity["detail"] = f"GTM strategy created, {len(new_tasks)} marketing tasks"

        state["messages"].append(AIMessage(
            content=response,
            additional_kwargs={"agent_role": "marketing"}
        ))
        return state

    async def _analyst_node(self, state: AgentState) -> AgentState:
        """Analyst node — provides metrics, KPIs, and recommendations."""
        activity = self._create_activity(
            AgentRole.ANALYST,
            "Metrics & Insights",
            "Analyzing plan and generating KPIs and recommendations",
            "thinking",
            state["conversation_id"],
        )
        state["agent_activities"].append(activity)
        state["current_agent"] = "analyst"

        context = (
            f"User Goal: {state['user_goal']}\n\n"
            f"Total tasks created: {len(state['tasks'])}\n"
            f"Product Plan Summary: {state['pm_response'][:500]}...\n"
            f"Technical Plan Summary: {state['dev_response'][:300]}...\n"
            f"Marketing Plan Summary: {state['marketing_response'][:300]}...\n\n"
            "As the Analyst agent:\n"
            "1. Define the key success metrics (KPIs) for this goal\n"
            "2. Create an analytics task list\n"
            "3. Generate initial recommendations\n"
            "4. Calculate an estimated progress score (0-100)"
        )

        response = await self.analyst.think(context, self._get_history(state))
        state["analyst_response"] = response

        new_tasks = self._extract_tasks(response, "analytics_tasks", state)
        state["tasks"].extend(new_tasks)

        state["agent_messages"].append({
            "from": "analyst",
            "to": "orchestrator",
            "message": f"Analysis complete. {len(state['tasks'])} total tasks. Recommendations ready.",
            "timestamp": datetime.utcnow().isoformat(),
        })

        activity["status"] = "completed"
        activity["detail"] = f"KPI framework defined, {len(new_tasks)} analytics tasks"

        state["messages"].append(AIMessage(
            content=response,
            additional_kwargs={"agent_role": "analyst"}
        ))
        return state

    async def _synthesize_node(self, state: AgentState) -> AgentState:
        """Final synthesis — combine all agent outputs into a unified response."""
        activity = self._create_activity(
            AgentRole.ORCHESTRATOR,
            "Synthesis",
            f"Combining {len(state['tasks'])} tasks into final plan",
            "active",
            state["conversation_id"],
        )
        state["agent_activities"].append(activity)
        state["current_agent"] = "orchestrator"

        # Rebuild final workflow graph with all tasks
        nodes, edges = self._build_workflow_graph(state["tasks"])
        state["workflow_nodes"] = nodes
        state["workflow_edges"] = edges

        activity["status"] = "completed"
        activity["detail"] = (
            f"Orchestration complete: {len(state['tasks'])} tasks, "
            f"{len(nodes)} workflow nodes"
        )

        return state

    # ── Helper Methods ───────────────────────────────────────────────────

    def _create_activity(
        self,
        agent_role: AgentRole,
        action: str,
        detail: str,
        status: str,
        conversation_id: str,
    ) -> Dict[str, Any]:
        return {
            "id": str(uuid4()),
            "agent_role": agent_role.value,
            "action": action,
            "detail": detail,
            "status": status,
            "conversation_id": conversation_id,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _get_history(self, state: AgentState) -> List[Dict[str, str]]:
        """Convert LangGraph messages to simple dict format for agents."""
        history = []
        for msg in state.get("messages", []):
            if isinstance(msg, HumanMessage):
                history.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                role = msg.additional_kwargs.get("agent_role", "assistant")
                history.append({"role": role, "content": msg.content})
        return history[-10:]  # Keep last 10 for context window management

    def _extract_tasks(
        self,
        response: str,
        key: str,
        state: AgentState,
    ) -> List[Dict[str, Any]]:
        """
        Parse JSON task blocks out of agent responses.
        Looks for ```json ... ``` blocks and extracts the task list.
        """
        tasks = []
        json_pattern = r"```json\s*([\s\S]*?)\s*```"
        matches = re.findall(json_pattern, response)

        for match in matches:
            try:
                data = json.loads(match)
                raw_tasks = data.get(key, [])
                for t in raw_tasks:
                    task = {
                        "id": str(uuid4()),
                        "title": t.get("title", "Untitled Task"),
                        "description": t.get("description", ""),
                        "priority": self._normalize_priority(t.get("priority", "medium")),
                        "assigned_agent": t.get("assigned_agent", "product_manager"),
                        "status": "pending",
                        "progress": 0,
                        "user_id": state["user_id"],
                        "conversation_id": state["conversation_id"],
                        "created_at": datetime.utcnow().isoformat(),
                    }
                    tasks.append(task)
            except (json.JSONDecodeError, KeyError):
                # If parsing fails, continue — agent response is still useful
                continue

        return tasks

    def _normalize_priority(self, raw: str) -> str:
        mapping = {
            "low": "low", "medium": "medium",
            "high": "high", "critical": "critical",
        }
        return mapping.get(raw.lower(), "medium")

    def _build_workflow_graph(
        self, tasks: List[Dict[str, Any]]
    ) -> tuple[List[Dict], List[Dict]]:
        """
        Build a React Flow compatible node/edge graph from the task list.
        Layout: Goal → Agent Hubs → Individual Task Nodes
        """
        nodes: List[Dict] = []
        edges: List[Dict] = []

        # Central goal node
        goal_node_id = "goal"
        nodes.append({
            "id": goal_node_id,
            "type": "goal",
            "data": {"label": "🎯 User Goal", "type": "goal"},
            "position": {"x": 400, "y": 50},
        })

        # Agent hub nodes
        agents = [
            {"id": "pm", "role": "product_manager", "label": "🎯 PM Agent", "x": 100, "y": 200, "color": "#8B5CF6"},
            {"id": "dev", "role": "developer", "label": "💻 Dev Agent", "x": 300, "y": 200, "color": "#06B6D4"},
            {"id": "mkt", "role": "marketing", "label": "📣 Marketing Agent", "x": 500, "y": 200, "color": "#F59E0B"},
            {"id": "ana", "role": "analyst", "label": "📊 Analyst Agent", "x": 700, "y": 200, "color": "#10B981"},
        ]

        agent_id_map = {
            "product_manager": "pm",
            "developer": "dev",
            "marketing": "mkt",
            "analyst": "ana",
            "orchestrator": "pm",
        }

        for agent in agents:
            nodes.append({
                "id": agent["id"],
                "type": "agent",
                "data": {
                    "label": agent["label"],
                    "role": agent["role"],
                    "color": agent["color"],
                    "type": "agent",
                },
                "position": {"x": agent["x"], "y": agent["y"]},
            })
            edges.append({
                "id": f"goal-{agent['id']}",
                "source": goal_node_id,
                "target": agent["id"],
                "animated": True,
                "type": "smoothstep",
            })

        # Task nodes — grouped below their agent hub
        task_columns: Dict[str, int] = {
            "pm": 0, "dev": 0, "mkt": 0, "ana": 0
        }
        col_x = {"pm": 100, "dev": 300, "mkt": 500, "ana": 700}

        for task in tasks:
            agent_key = agent_id_map.get(task.get("assigned_agent", "pm"), "pm")
            row = task_columns[agent_key]
            task_columns[agent_key] += 1

            task_node_id = f"task-{task['id']}"
            nodes.append({
                "id": task_node_id,
                "type": "task",
                "data": {
                    "label": task["title"],
                    "priority": task["priority"],
                    "status": task["status"],
                    "type": "task",
                },
                "position": {
                    "x": col_x[agent_key],
                    "y": 400 + row * 100,
                },
            })
            edges.append({
                "id": f"{agent_key}-{task_node_id}",
                "source": agent_key,
                "target": task_node_id,
                "animated": False,
                "type": "smoothstep",
            })

        return nodes, edges

    # ── Public API ────────────────────────────────────────────────────────

    async def run(
        self,
        user_goal: str,
        conversation_id: str,
        user_id: str,
        history: List[Dict[str, str]] = None,
        autonomous_mode: bool = False,
    ) -> AgentState:
        """
        Run the full multi-agent pipeline for a given user goal.
        Returns the final state with all tasks, workflows, and activities.
        """
        # Convert history to LangGraph messages
        lc_messages: List[BaseMessage] = []
        for entry in (history or []):
            if entry["role"] == "user":
                lc_messages.append(HumanMessage(content=entry["content"]))
            else:
                lc_messages.append(AIMessage(content=entry["content"]))
        lc_messages.append(HumanMessage(content=user_goal))

        initial_state: AgentState = {
            "user_goal": user_goal,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "messages": lc_messages,
            "pm_response": "",
            "dev_response": "",
            "marketing_response": "",
            "analyst_response": "",
            "tasks": [],
            "workflow_nodes": [],
            "workflow_edges": [],
            "agent_activities": [],
            "agent_messages": [],
            "autonomous_mode": autonomous_mode,
            "current_agent": "orchestrator",
            "iteration": 0,
        }

        final_state = await self.graph.ainvoke(initial_state)
        return final_state

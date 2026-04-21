"""
Product Manager Agent — specialized AI agent for strategic planning.

This agent acts as a seasoned product manager who:
- Breaks down high-level user goals into features and tasks
- Prioritizes work using impact vs. effort frameworks
- Creates roadmaps and sprint plans
- Communicates requirements to other agents
"""

from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from typing import List, Dict, Any, AsyncGenerator
from app.config import settings

SYSTEM_PROMPT = """You are an expert Product Manager AI Agent working inside the AutoPilot AI Workspace system.

Your role is to:
1. Analyze the user's high-level goal and break it into clear, actionable product features
2. Prioritize features using the RICE framework (Reach, Impact, Confidence, Effort)
3. Create structured task lists with clear acceptance criteria
4. Define success metrics for each feature
5. Communicate requirements clearly to the Developer, Marketing, and Analyst agents

Output format for task generation:
When breaking down a goal, always respond with:
- A brief strategic summary (2-3 sentences)
- A numbered list of prioritized tasks (each with: title, description, priority [low/medium/high/critical], assigned agent)
- Success metrics to track progress

Style: Be concise, structured, and business-oriented. Think like a startup PM.
Always use JSON-compatible structure when outputting tasks for the system to parse.

Example task output format (always include this exact JSON block):
```json
{
  "tasks": [
    {
      "title": "Define target audience",
      "description": "Research and document primary user personas",
      "priority": "high",
      "assigned_agent": "product_manager",
      "estimated_hours": 4
    }
  ],
  "workflow_title": "Product Launch Workflow",
  "workflow_description": "End-to-end workflow for launching the product"
}
```"""


class ProductManagerAgent:
    """Product Manager agent — strategic planning and task decomposition."""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.7,
            streaming=True,
        )
        self.name = "Product Manager"
        self.role = "product_manager"
        self.avatar = "🎯"
        self.description = "Plans features, prioritizes tasks, manages roadmap"

    def _build_messages(
        self, user_message: str, history: List[Dict[str, str]]
    ) -> list:
        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        for entry in history:
            if entry["role"] == "user":
                messages.append(HumanMessage(content=entry["content"]))
            elif entry["role"] in ("assistant", "agent"):
                messages.append(AIMessage(content=entry["content"]))
        messages.append(HumanMessage(content=user_message))
        return messages

    async def think(
        self, user_message: str, history: List[Dict[str, str]] = None
    ) -> str:
        """Generate a full response (non-streaming)."""
        messages = self._build_messages(user_message, history or [])
        response = await self.llm.ainvoke(messages)
        return response.content

    async def stream(
        self, user_message: str, history: List[Dict[str, str]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens one by one."""
        messages = self._build_messages(user_message, history or [])
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "role": self.role,
            "avatar": self.avatar,
            "description": self.description,
            "color": "#8B5CF6",  # purple
        }

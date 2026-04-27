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

SYSTEM_PROMPT = """You are an expert Product Manager AI Agent. Your goal is to provide HIGH-FIDELITY, DYNAMIC product strategy.

NEVER use generic templates. Every response must be uniquely tailored to the user's SPECIFIC goal and industry.

Your role is to:
1. Conduct a deep-dive analysis of the user's goal, identifying unique market opportunities and niche features.
2. Build a comprehensive RICE-prioritized backlog that reflects actual industry constraints.
3. Define success metrics (KPIs) that are specifically relevant to the user's business model.
4. Create a High-Fidelity Roadmap with at least 3 detailed phases, each containing specific milestones.

OUTPUT REQUIREMENTS:
- <thinking>: Detail your strategic rationale. Why this specific roadmap? What are the unique competitive advantages?
- Strategic Summary: A deep, professional analysis of the project's viability and path to market.
- Tasks JSON: A list of 5-8 highly specific, non-generic tasks.
- Roadmap Artifact: A JSON object representing a detailed, industry-specific roadmap.

ROADMAP ARTIFACT SPEC:
```json
{
  "type": "roadmap",
  "data": {
    "phases": [
      { 
        "title": "Specific Phase Title (e.g. Core Engine Development)", 
        "description": "Deep technical/product description of this phase's unique focus.", 
        "status": "In Progress",
        "milestones": ["Milestone 1", "Milestone 2", "Milestone 3"]
      },
      ... (at least 3-4 phases)
    ]
  }
}
```

Style: Extremely professional, data-driven, and innovative. Think like a Lead PM at a Tier-1 Tech Firm."""


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

"""
Analyst Agent — specialized AI agent for data analysis and insights.

This agent acts as a data-driven business analyst who:
- Tracks metrics and KPIs across all workflows
- Generates insights from gathered data
- Provides AI-powered recommendations to improve strategy
- Monitors system health and progress scores
- Identifies patterns and optimization opportunities
"""

from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from typing import List, Dict, Any, AsyncGenerator
from app.config import settings

SYSTEM_PROMPT = """You are a Senior Lead Data Analyst AI Agent. Your goal is to provide DEEP, DYNAMIC data intelligence.

NEVER use generic metrics. Every dashboard and data pipeline must be uniquely designed for the user's SPECIFIC business model.

Your role is to:
1. Design comprehensive data architectures and tracking schemas.
2. Define complex KPIs and behavioral metrics specific to the user's domain.
3. Build data pipeline visualizations that show how information flows from events to insights.

OUTPUT REQUIREMENTS:
- <thinking>: Detail your analytical choices. Why these specific metrics? How will you track user retention?
- Analytics Plan: A deep-dive into tracking strategy and reporting requirements.
- Analyst Tasks JSON: 5-8 specific data implementation tasks.
- Data Pipeline Artifact: A JSON object containing a COMPLEX Mermaid `graph TD` chart.

DATA PIPELINE SPEC:
```json
{
  "type": "mermaid",
  "data": {
    "chart": "graph TD\n  Client((Client Events)) -->|Segment| Lake[Data Lake]\n  Lake -->|dbt| Warehouse[Snowflake/BigQuery]\n  ... (must be complex, 6+ nodes, industry-specific terminology)"
  }
}
```

Style: Highly analytical, precise, and insight-driven. Think like a VP of Data at a scale-up."""


class AnalystAgent:
    """Analyst agent — data analysis, KPIs, insights, and recommendations."""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.4,  # moderate temp — analytical but not dry
            streaming=True,
        )
        self.name = "Analyst"
        self.role = "analyst"
        self.avatar = "📊"
        self.description = "Tracks metrics, insights, and AI recommendations"

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
        """Generate a full analytical response (non-streaming)."""
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
            "color": "#10B981",  # emerald
        }

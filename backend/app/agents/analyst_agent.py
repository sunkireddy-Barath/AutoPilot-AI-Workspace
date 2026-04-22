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

SYSTEM_PROMPT = """You are an expert Data Analyst AI Agent working inside the AutoPilot AI Workspace system.

Your role is to:
1. Analyze the current state of tasks, workflows, and business metrics
2. Generate actionable insights from data patterns you observe
3. Create KPI dashboards and metric definitions
4. Identify bottlenecks, risks, and optimization opportunities
5. Provide evidence-based recommendations to other agents
6. Calculate progress scores and system health metrics

Types of analysis you perform:
- Task completion rate analysis
- Workflow efficiency scoring
- Business impact assessment
- Risk matrix evaluation
- ROI projections for recommended actions
- Competitive positioning analysis (when given a domain)

Style: Be data-driven, precise, and actionable. Always back recommendations with
logic and frameworks (e.g., North Star Metric, OKRs, AARRR funnel, etc.).
Think like a senior analyst at a data-first startup.

Output format:
Always begin your response with a <thinking> section where you explain your data analysis approach, metric selection, and risk evaluation.

Example:
<thinking>
I see the user goal is to scale a food delivery app. The key bottleneck is currently courier retention. I'll focus my analysis on retention cohorts and driver incentive efficiency.
</thinking>

When outputting analytics tasks, always include this JSON block:
```json
{
  "analytics_tasks": [
    {
      "title": "Define core KPI dashboard",
      "description": "Identify 5 key metrics that indicate product success",
      "priority": "high",
      "assigned_agent": "analyst",
      "metrics": ["DAU", "retention_rate", "conversion_rate"],
      "estimated_hours": 3
    }
  ],
  "key_insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Do X to improve Y by Z%"],
  "progress_score": 65
}
```"""


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

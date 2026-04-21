"""
Marketing Agent — specialized AI agent for growth and marketing strategy.

This agent acts as a growth-focused marketing expert who:
- Creates go-to-market strategies
- Generates content (copy, campaigns, social posts)
- Builds messaging frameworks for different audiences
- Plans email campaigns and content calendars
- Tracks marketing metrics and KPIs
"""

from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from typing import List, Dict, Any, AsyncGenerator
from app.config import settings

SYSTEM_PROMPT = """You are an expert Marketing AI Agent working inside the AutoPilot AI Workspace system.

Your role is to:
1. Create compelling go-to-market (GTM) strategies
2. Generate high-quality marketing content: landing page copy, email campaigns, social posts
3. Build messaging frameworks that resonate with target audiences
4. Plan content calendars and campaign schedules
5. Define KPIs and marketing metrics to track
6. Collaborate with the Product Manager to align messaging with product value

Content you can generate:
- Email campaign sequences (subject lines, body copy, CTAs)
- Social media posts (LinkedIn, Twitter, Instagram formats)
- Landing page headlines and value propositions
- Blog post outlines and key messages
- Ad copy variations (A/B testing ready)
- Launch announcement strategy

Style: Be creative, persuasive, and data-driven. Write copy that converts.
Think like a growth marketer at a Series A startup.

When outputting marketing tasks, always include this JSON block:
```json
{
  "marketing_tasks": [
    {
      "title": "Write launch email sequence",
      "description": "Create 3-email launch sequence with subject lines and CTAs",
      "priority": "high",
      "assigned_agent": "marketing",
      "content_type": "email",
      "estimated_hours": 5
    }
  ],
  "campaign_name": "Product Launch Campaign",
  "target_audience": "Startup founders and product managers"
}
```"""


class MarketingAgent:
    """Marketing agent — GTM strategy, content generation, and campaign planning."""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.8,  # higher creativity for marketing copy
            streaming=True,
        )
        self.name = "Marketing"
        self.role = "marketing"
        self.avatar = "📣"
        self.description = "Creates campaigns, content, and messaging strategy"

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
        """Generate a full marketing response (non-streaming)."""
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
            "color": "#F59E0B",  # amber
        }

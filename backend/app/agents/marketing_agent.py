"""
Marketing Agent — specialized AI agent for strategy and content creation.

This agent acts as a senior growth marketer who:
- Develops go-to-market (GTM) strategies
- Creates multi-channel campaign plans
- Generates high-quality marketing copy and content
- Researches target audiences and competitors
- Plans launch sequences and social media strategy
"""

from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from typing import List, Dict, Any, AsyncGenerator
from app.config import settings

SYSTEM_PROMPT = """You are an expert Senior Marketing AI Agent working inside the AutoPilot AI Workspace system.

Your role is to:
1. Create comprehensive go-to-market strategies based on product features
2. Generate specific marketing tasks (content, campaigns, messaging)
3. Define target audience personas and key messaging pillars
4. Plan strategic launch sequences across multiple channels
5. Optimize marketing plans based on Analyst Agent feedback
6. Use the `google_research_simulation` tool to gather market intelligence and competitor data.

Output format for marketing plans:
When given a feature or goal, respond with:
- GTM Strategy Overview
- Target Audience & Segments
- Content Calendar & Channels
- Key Messaging & Value Props
- Campaign Tasks (with priority)
- Success Metrics for the campaign

CRITICAL: When you need more information about a market or competitors, use the `google_research_simulation` tool.

Style: Be creative yet strategic, persuasive, and growth-oriented. 
Think like a Lead Marketer at a disruptive tech startup.

Output format:
Always begin your response with a <thinking> section where you explain your marketing strategy, channel selection, and audience research findings.

Example:
<thinking>
Since this is a B2C SaaS, I'll focus on TikTok and Instagram for high organic reach. I'll also leverage influencer partnerships to build trust quickly.
</thinking>

When outputting marketing tasks, always include this JSON block:
```json
{
  "marketing_tasks": [
    {
      "title": "Draft landing page copy",
      "description": "Create high-converting copy focusing on value prop X",
      "priority": "high",
      "assigned_agent": "marketing",
      "channel": "Website",
      "estimated_hours": 4
    }
  ],
  "gtm_plan_summary": "Brief GTM strategy summary"
}
```"""


class MarketingAgent:
    """Marketing agent — GTM strategy, content, and campaign planning."""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.6,  # higher temp for creative output
            streaming=True,
        )
        self.name = "Marketing"
        self.role = "marketing"
        self.avatar = "📣"
        self.description = "Creates GTM strategies, campaigns, and content"

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

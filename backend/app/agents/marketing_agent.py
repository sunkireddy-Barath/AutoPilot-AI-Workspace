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

SYSTEM_PROMPT = """You are a Senior Lead Marketing AI Agent. Your goal is to provide HIGH-IMPACT, DYNAMIC growth strategies.

NEVER use generic funnels. Every campaign and GTM plan must be uniquely engineered for the user's SPECIFIC product and niche.

Your role is to:
1. Engineer comprehensive go-to-market strategies that identify unique acquisition channels.
2. Build detailed growth funnels (AARRR) that reflect actual user journeys for this specific project.
3. Design specific messaging pillars and value propositions that resonate with the target audience.
4. Use the `google_research_simulation` tool to gather actual competitor data and market trends.

OUTPUT REQUIREMENTS:
- <thinking>: Detail your marketing rationale. Why these specific channels? What is the unique 'growth hook'?
- GTM Strategy: A deep-dive into the launch plan, audience segments, and messaging.
- Marketing Tasks JSON: 5-8 highly specific campaign tasks.
- Growth Funnel Artifact: A JSON object containing a COMPLEX Mermaid `graph LR` chart.

GROWTH FUNNEL SPEC:
```json
{
  "type": "mermaid",
  "data": {
    "chart": "graph LR\n  Ad((Social Ads)) --> Landing[Custom Landing Page]\n  Landing -->|Signup| Onboarding[Interactive Flow]\n  ... (must be complex, 6+ stages, industry-specific terminology)"
  }
}
```

Style: Creative, aggressive, and highly analytical. Think like a Head of Growth at a Unicorn Startup."""


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

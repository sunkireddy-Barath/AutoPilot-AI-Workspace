"""
Operations Agent — specialized AI agent for automation and deployment.

This agent acts as a SRE/DevOps engineer who:
- Designs CI/CD pipelines
- Orchestrates cloud infrastructure (simulation)
- Configures automation triggers and API connections
- Manages deployment environments
"""

from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from typing import List, Dict, Any, AsyncGenerator
from app.config import settings

SYSTEM_PROMPT = """You are an expert Operations & Automation AI Agent working inside the AutoPilot AI Workspace system.

Your role is to:
1. Design robust CI/CD pipelines for the product (GitHub Actions, Vercel, etc.)
2. Define infrastructure requirements (AWS/Azure/Docker/Vercel)
3. Connect third-party APIs and setup automation triggers (Zapier/Webhooks)
4. Ensure the system is "production-ready" with monitoring and logging
5. Create operational tasks for the workspace

Output format:
Always begin your response with a <thinking> section where you explain your infrastructure choices, automation logic, and deployment strategy. Then provide your summary and JSON tasks.

Example:
<thinking>
Since this is a Next.js app, I will choose Vercel for deployment due to its edge capabilities. I'll also setup a GitHub Action for automated testing.
</thinking>

- A brief operational summary (2-3 sentences)
- A numbered list of prioritized tasks (each with: title, description, priority [low/medium/high/critical], assigned agent: "operations")
- Infrastructure components identified

Style: Be technical, efficient, and reliability-focused. Think like a Senior DevOps Engineer.
Always use JSON-compatible structure when outputting tasks for the system to parse.

Example JSON block:
```json
{
  "tasks": [
    {
      "title": "Configure GitHub Actions",
      "description": "Setup CI/CD pipeline for automated testing and deployment",
      "priority": "high",
      "assigned_agent": "operations"
    }
  ]
}
```"""

class OperationsAgent:
    """Operations agent — automation and infrastructure specialist."""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.4,
        )
        self.name = "Operations Expert"
        self.role = "operations"
        self.avatar = "⚙️"
        self.description = "Manages deployment, CI/CD, and API automations"

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
        """Generate a full response."""
        messages = self._build_messages(user_message, history or [])
        response = await self.llm.ainvoke(messages)
        return response.content

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "role": self.role,
            "avatar": self.avatar,
            "description": self.description,
            "color": "#EC4899",  # pink
        }

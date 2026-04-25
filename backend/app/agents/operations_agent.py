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
Always begin your response with a <thinking> section where you explain your infrastructure choices, automation logic, and deployment strategy.
Then provide your summary and a deployment flow artifact.

Output Components:
1. <thinking>...</thinking>
2. Operational Summary (Text)
3. Tasks JSON:
```json
{
  "tasks": [...]
}
```
4. Operations Artifact JSON (Mermaid graph TB for deployment flow):
```json
{
  "type": "mermaid",
  "data": {
    "chart": "graph TB\n  Source[GitHub]-->Build[CI/CD]\n  Build-->Deploy[Vercel/Cloud]"
  }
}
```

Style: Be technical, efficient, and reliability-focused. Think like a Senior DevOps Engineer.
CRITICAL: Use valid Mermaid `graph TB` syntax for deployment flows."""

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

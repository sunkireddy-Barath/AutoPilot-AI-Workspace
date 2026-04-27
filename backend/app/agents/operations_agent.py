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

SYSTEM_PROMPT = """You are a Senior Lead Operations AI Agent. Your goal is to provide DEEP, DYNAMIC operational blueprints.

NEVER use generic workflows. Every process and scaling plan must be uniquely engineered for the user's SPECIFIC project constraints.

Your role is to:
1. Design complex operational workflows and scaling strategies.
2. Define CI/CD pipelines, deployment architectures, and team structures.
3. Build process flow visualizations that show the path from development to production scale.

OUTPUT REQUIREMENTS:
- <thinking>: Detail your operational rationale. Why this specific deployment strategy? How will you manage infra-as-code?
- Operations Plan: A deep-dive into infrastructure, DevOps, and team scaling.
- Operations Tasks JSON: 5-8 highly specific infra/ops tasks.
- Process Flow Artifact: A JSON object containing a COMPLEX Mermaid `graph TB` chart.

PROCESS FLOW SPEC:
```json
{
  "type": "mermaid",
  "data": {
    "chart": "graph TB\n  Dev[Code Commit] -->|GitHub Actions| Test[Automated QA]\n  Test -->|Pass| Deploy[Staging Environment]\n  ... (must be complex, 6+ nodes, industry-specific terminology)"
  }
}
```

Style: Pragmatic, efficiency-focused, and highly organized. Think like a COO or Head of Infra at a fast-growing tech company."""

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

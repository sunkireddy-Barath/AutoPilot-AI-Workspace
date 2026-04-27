"""
Developer Agent — specialized AI agent for technical implementation.

This agent acts as a senior full-stack developer who:
- Converts product requirements into technical specifications
- Designs system architecture and data models
- Generates code logic, API designs, and database schemas
- Reviews technical feasibility of features
- Documents technical decisions
"""

from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from typing import List, Dict, Any, AsyncGenerator
from app.config import settings

SYSTEM_PROMPT = """You are a Senior Lead Developer AI Agent. Your goal is to provide DEEP technical orchestration and architecture.

NEVER use generic 'Hello World' architectures. Every diagram and tech spec must be 100% custom-built for the user's SPECIFIC request.

Your role is to:
1. Design complex, scalable system architectures using Next.js, FastAPI, and Supabase.
2. Create detailed database schemas (ER Diagrams) that reflect the actual data entities required.
3. Define precise API contracts and service boundaries.
4. Use the `write_workspace_file` tool to commit actual technical documentation or code skeletons to the repo.

OUTPUT REQUIREMENTS:
- <thinking>: Detail your technical choices. Why this specific database structure? How will you handle scaling?
- Technical Spec: A deep-dive into the stack, including specific libraries and integration patterns.
- Technical Tasks JSON: 5-10 specific implementation steps.
- Mermaid Artifact: A JSON object containing a COMPLEX Mermaid chart (Architecture or ERD).

MERMAID ARTIFACT SPEC:
```json
{
  "type": "mermaid",
  "data": {
    "chart": "graph TB\n  User((User)) -->|Auth| Supa[Supabase Auth]\n  Supa -->|Token| API[FastAPI Backend]\n  ... (must be complex, 8+ nodes, industry-specific terminology)"
  }
}
```

CRITICAL: If the goal requires a database, use `erDiagram`. If it's a system flow, use `graph TB`. ALWAYS make the chart deep and professional."""


class DeveloperAgent:
    """Developer agent — technical architecture and implementation specs."""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.3,  # lower temp for more precise technical output
            streaming=True,
        )
        self.name = "Developer"
        self.role = "developer"
        self.avatar = "💻"
        self.description = "Generates technical specs, architecture, and code logic"

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
        """Generate a full technical response (non-streaming)."""
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
            "color": "#06B6D4",  # cyan
        }

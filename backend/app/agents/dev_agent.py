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

SYSTEM_PROMPT = """You are an expert Senior Developer AI Agent working inside the AutoPilot AI Workspace system.

Your role is to:
1. Translate product requirements into concrete technical specifications
2. Design clean system architectures (APIs, databases, services)
3. Generate production-quality code logic and pseudocode
4. Identify technical risks and propose solutions
5. Estimate technical complexity and implementation time
6. Collaborate with the Product Manager agent for feasibility checks
7. Use the `write_workspace_file` tool to save code skeletons, API designs, and configuration files.

Output format for technical specs:
When given a feature or task, respond with:
- Technical approach summary
- Architecture decisions (why this approach)
- API endpoint designs (if applicable)
- Database schema changes (if applicable)
- Implementation steps with code snippets
- Technical risks and mitigation strategies

CRITICAL: When you are ready to write a file, use the available `write_workspace_file` tool. Do not just output the code in markdown; actually call the tool to save it.

Style: Be precise, technical, and pragmatic. Write clean, readable code. 
Think like a senior engineer at a top tech startup.

Output format:
Always begin your response with a <thinking> section where you explain your technical design choices, trade-offs, and architecture decisions.
Then provide your technical spec and a Mermaid artifact for visualization.

Output Components:
1. <thinking>...</thinking>
2. Technical Spec (Text)
3. Technical Tasks JSON:
```json
{
  "technical_tasks": [...]
}
```
4. Mermaid Artifact JSON (Architecture or ER Diagram):
```json
{
  "type": "mermaid",
  "data": {
    "chart": "graph TB\n  A-->B..."
  }
}
```

Tech stack context: Next.js (frontend), FastAPI (backend), Supabase (database), 
LangGraph (AI orchestration), Tailwind CSS (styling).

Style: Be precise, technical, and pragmatic. Write clean, readable code. 
Think like a senior engineer at a top tech startup.
CRITICAL: Use valid Mermaid syntax for charts. Use `graph TB` for architecture and `erDiagram` for database schemas."""


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

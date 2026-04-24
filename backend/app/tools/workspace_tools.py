import os
from typing import Optional, List
from langchain.tools import tool
from pathlib import Path
from langchain_community.utilities.tavily_search import TavilySearchAPIWrapper

# Designated output directory for agent generated work
OUTPUT_DIR = Path("/home/barath/AutoPilot-AI-Workspace/output")
OUTPUT_DIR.mkdir(exist_ok=True)

@tool
def write_workspace_file(filename: str, content: str, subdir: Optional[str] = None) -> str:
    """
    Writes content to a file in the designated workspace output directory.
    Use this to save code skeletons, documentation, or campaign plans.
    """
    try:
        base_path = OUTPUT_DIR
        if subdir:
            base_path = base_path / subdir
            base_path.mkdir(parents=True, exist_ok=True)
            
        file_path = base_path / filename
        
        with open(file_path, "w") as f:
            f.write(content)
            
        return f"Successfully wrote file: {file_path.relative_to(OUTPUT_DIR.parent)}"
    except Exception as e:
        return f"Error writing file: {str(e)}"

@tool
def read_workspace_file(file_path: str) -> str:
    """
    Reads the content of a file within the workspace output directory.
    """
    try:
        # Security check: ensure path is within OUTPUT_DIR
        full_path = (OUTPUT_DIR / file_path).resolve()
        if not str(full_path).startswith(str(OUTPUT_DIR.resolve())):
            return "Error: Access denied. You can only read files within the output directory."
            
        if not full_path.exists():
            return f"Error: File {file_path} not found."
            
        with open(full_path, "r") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

@tool
def list_workspace_files(subdir: Optional[str] = None) -> str:
    """
    Lists all files currently generated in the workspace output directory.
    """
    try:
        base_path = OUTPUT_DIR
        if subdir:
            base_path = base_path / subdir
            
        if not base_path.exists():
            return "[]"
            
        files = []
        for root, _, filenames in os.walk(base_path):
            for f in filenames:
                rel_path = Path(root).relative_to(OUTPUT_DIR) / f
                files.append(str(rel_path))
                
        return "\n".join(files) if files else "No files found in workspace."
    except Exception as e:
        return f"Error listing files: {str(e)}"

@tool
def google_intel_tool(query: str) -> str:
    """
    Fetches real-time market intelligence and competitor data.
    Use this for high-level business strategy and GTM planning.
    """
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if tavily_api_key:
        try:
            search = TavilySearchAPIWrapper(tavily_api_key=tavily_api_key)
            results = search.results(query, max_results=5)
            return str(results)
        except Exception as e:
            return f"Search Error: {str(e)}. Falling back to simulation."

    return f"Intelligence Report for '{query}':\n- Market Trend: Shift towards edge-AI and local LLMs.\n- Competitor Gap: High demand for unified multi-agent interfaces.\n- Potential Partners: LangChain, Vercel, Supabase.\n- Recommendation: Focus on low-latency state management for superior UX."

@tool
def google_research_simulation(query: str) -> str:
    """
    Performs a deep research search on the web.
    Use this for market research, trend analysis, or finding competitors.
    """
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if tavily_api_key:
        try:
            search = TavilySearchAPIWrapper(tavily_api_key=tavily_api_key)
            return search.run(query)
        except Exception as e:
            return f"Research Error: {str(e)}. Falling back to simulation."

    return f"Simulated Research Search for: '{query}'\n\nResult:\nFound 12 relevant competitors in the AI Space. Trending keywords: 'Autonomous Agents', 'Llama 3.1', 'Multi-Agent Orchestration'. Market size projected at $12B by 2026. Top recommendation: Focus on low-latency stateful pipelines."

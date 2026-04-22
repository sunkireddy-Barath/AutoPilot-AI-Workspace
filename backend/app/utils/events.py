import asyncio
from typing import List, Callable, Any

class EventBus:
    """
    Simple async event bus for real-time communication between 
    the LangGraph orchestrator and the WebSocket API.
    """
    def __init__(self):
        self.subscribers: List[Callable[[str, Any], Any]] = []

    def subscribe(self, callback: Callable[[str, Any], Any]):
        self.subscribers.append(callback)

    async def emit(self, event_type: str, data: Any):
        for callback in self.subscribers:
            if asyncio.iscoroutinefunction(callback):
                await callback(event_type, data)
            else:
                callback(event_type, data)

# Global singleton for the app
global_bus = EventBus()

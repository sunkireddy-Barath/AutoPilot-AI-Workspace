"""
Vercel Python Serverless Entry Point.

Vercel's @vercel/python runtime imports this module and looks for
the `app` ASGI object to handle incoming HTTP requests.
"""

from app.main import app  # noqa: F401 — re-exported as the ASGI handler

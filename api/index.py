"""
Vercel serverless entry point.
Vercel's Python runtime looks for a file at /api/index.py that exports
a WSGI/ASGI handler. We use Mangum to wrap the FastAPI app.
"""
from mangum import Mangum
from api.main import app

handler = Mangum(app, lifespan="off")

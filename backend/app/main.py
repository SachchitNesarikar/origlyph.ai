"""Main FastAPI entry point for Origlyph cultural heritage application."""
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config import settings
from .routes.health import router as health_router
from .routes.artifacts import router as artifacts_router
from .services.provenance import build_global_provenance_graph

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("origlyph")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Decode the places behind culture. API for cultural heritage discovery and provenance.",
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=False,  # no cookies/auth are used; wildcard + credentials is invalid
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compress JSON / JS / CSS responses (artifacts.json payloads and the SPA bundle)
app.add_middleware(GZipMiddleware, minimum_size=500)

# Register API Routers
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(artifacts_router, prefix=settings.API_PREFIX)


@app.get(f"{settings.API_PREFIX}/provenance/global")
def get_global_graph():
    """Return complete interconnected provenance network of all loaded artifacts."""
    return build_global_provenance_graph()


# Mount frontend static distribution if built (for unified single-process deployment)
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    logger.info("Serving built frontend from %s", FRONTEND_DIST)
    class ImmutableStaticFiles(StaticFiles):
        """Vite emits content-hashed asset names, so they can be cached forever."""

        async def get_response(self, path, scope):
            response = await super().get_response(path, scope)
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            return response

    app.mount("/assets", ImmutableStaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # v1 returned `null` (HTTP 200) for unknown /api paths; return a real 404
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = (FRONTEND_DIST / full_path).resolve()
        # Block path traversal outside dist
        if FRONTEND_DIST.resolve() in file_path.parents and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html", headers={"Cache-Control": "no-cache"})

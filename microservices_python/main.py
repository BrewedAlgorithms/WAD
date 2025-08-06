# microservices_python/main.py

import uvicorn
from fastapi import FastAPI

from config.settings import settings
from config.logging import get_logger
# REMOVE: No longer need the content_summarizer
from services import pdf_metadata_extract, research_analyzer

# Initialize logger
logger = get_logger(__name__)

# Create the main FastAPI application
app = FastAPI(
    title="Research Companion AI Services",
    description="A unified API for AI-powered research assistance, including PDF metadata extraction, summarization, and analysis.",
    version="1.1.0" # Version bump to reflect changes
)

# --- Mount the routers from each service ---

# Mount the PDF metadata extraction service router
app.include_router(
    pdf_metadata_extract.router,
    prefix="/pdf",
    tags=["PDF Processing"] # Renamed tag for clarity
)

# REMOVE: The entire router for the summarization service is gone.

# Mount the research analysis service router
app.include_router(
    research_analyzer.router,
    prefix="/research",
    tags=["Research Analysis"]
)

@app.get("/", tags=["Root"])
async def read_root():
    """
    Root endpoint providing basic information about the API.
    """
    return {
        "message": "Welcome to the Research Companion AI Services API",
        "documentation": "/docs"
    }

# --- Main execution block to run the unified service ---
if __name__ == "__main__":
    logger.info(f"Starting Unified Research Companion Service on {settings.SERVICE_HOST}:{settings.SERVICE_PORT}")
    uvicorn.run(
        "main:app",
        host=settings.SERVICE_HOST,
        port=settings.SERVICE_PORT,
        reload=True
    )
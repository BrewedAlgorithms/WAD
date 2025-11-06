# microservices_python/main.py

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import time

from config.settings import settings
from config.logging import get_logger, logger as root_logger
# REMOVE: No longer need the content_summarizer
from services import pdf_metadata_extract, research_analyzer, gorard_sieve_analyzer

# Initialize logger
logger = get_logger(__name__)

# Create the main FastAPI application
app = FastAPI(
    title="Research Companion AI Services",
    description="A unified API for AI-powered research assistance, including PDF metadata extraction, summarization, and analysis.",
    version="1.1.0" # Version bump to reflect changes
)

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware to log requests and responses."""
    start_time = time.time()
    
    # Log request details
    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "client_host": request.client.host if request.client else "unknown",
            "client_port": request.client.port if request.client else "unknown",
        },
    )
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add process time header
        response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
        
        # Log response details
        logger.info(
            f"Response: {request.method} {request.url.path} - Status: {response.status_code}",
            extra={
                "status_code": response.status_code,
                "process_time_ms": round(process_time * 1000, 2),
            },
        )
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        root_logger.exception(
            f"An unhandled exception occurred during the request: {request.method} {request.url.path}",
            extra={
                "error": str(e),
                "process_time_ms": round(process_time * 1000, 2),
            },
        )
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": {"code": "UNHANDLED_EXCEPTION", "message": "An internal server error occurred."}}
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

# Mount the Gorard Sieve analyzer service router
app.include_router(
    gorard_sieve_analyzer.router,
    prefix="/gorard-sieve",
    tags=["Gorard Sieve Analysis"]
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
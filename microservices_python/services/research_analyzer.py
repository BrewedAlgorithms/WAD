# microservices_python/services/research_analyzer.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from config.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

# --- Pydantic Models ---
# (Models remain the same as before)
class AnalysisRequest(BaseModel):
    content: str = Field(..., description="The main content of a research paper or abstract.")
    context_papers: Optional[List[str]] = Field(None, description="Content from related papers for context.")
    analysis_tasks: List[str] = Field(
        default=["trend_analysis", "gap_identification", "recommendations"],
        description="A list of analysis tasks to perform."
    )

class TrendAnalysis(BaseModel):
    topic: str
    trend_type: str
    confidence: float

class PaperRecommendation(BaseModel):
    title: str
    reason: str
    doi: Optional[str] = None

class AnalysisResult(BaseModel):
    research_trends: Optional[List[TrendAnalysis]] = None
    research_gaps: Optional[List[str]] = None
    paper_recommendations: Optional[List[PaperRecommendation]] = None

class SuccessResponse(BaseModel):
    success: bool = True
    analysis: AnalysisResult

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail


@router.post(
    "/analyze",
    response_model=SuccessResponse,
    responses={500: {"model": ErrorResponse}},
    summary="Performs advanced analysis on research content"
)
async def analyze_research(request: AnalysisRequest):
    try:
        logger.info(f"Received analysis request for tasks: {request.analysis_tasks}")

        # Placeholder for Gemini analysis logic.
        # A dedicated gemini_client function would be created for this.
        
        # MOCK RESPONSE
        mock_analysis = AnalysisResult(
            research_trends=[
                TrendAnalysis(topic="Explainable AI (XAI) in Healthcare", trend_type="Emerging", confidence=0.88)
            ],
            research_gaps=[
                "Lack of multi-modal datasets for training comprehensive diagnostic models."
            ],
            paper_recommendations=[
                PaperRecommendation(
                    title="A Survey on Explainable AI for Healthcare",
                    reason="Provides a foundational overview of the key identified trend.",
                    doi="10.1109/SURVEY.2023.12345"
                )
            ]
        )

        return SuccessResponse(analysis=mock_analysis)

    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": {"code": "ANALYSIS_FAILED", "message": str(e)}}
        )
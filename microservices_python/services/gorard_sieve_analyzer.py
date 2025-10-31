# microservices_python/services/gorard_sieve_analyzer.py

from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import os
import aiofiles

from config.logging import get_logger
from config.settings import settings
from utils.validators import validate_file
from utils.pdf_utils import extract_text_from_pdf
from utils.text_utils import clean_text
from utils.gemini_client import get_gorard_sieve_rating

# Initialize logger and router
logger = get_logger(__name__)
router = APIRouter()

# --- Pydantic Models for API Response ---

class CategoryScore(BaseModel):
    score: int = Field(..., ge=0, le=4, description="Score from 0 (lowest) to 4 (highest)")
    reasoning: str = Field(..., description="Detailed reasoning for the score")

class GorardSieveRating(BaseModel):
    design: CategoryScore
    scale: CategoryScore
    completeness_of_data: CategoryScore
    data_quality: CategoryScore
    fidelity: CategoryScore
    validity: CategoryScore
    overall_rating: int = Field(..., ge=0, le=4, description="Overall rating (minimum of all category scores)")

class SuccessResponse(BaseModel):
    success: bool = True
    gorard_sieve_rating: GorardSieveRating
    analysis_info: dict

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail


@router.post(
    "/analyze-gorard-sieve",
    response_model=SuccessResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file or processing error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    },
    summary="Evaluate research paper using Gorard Sieve rubric",
    description="""
    Analyzes a research paper PDF using the Gorard Sieve rubric to assess its trustworthiness and quality.
    
    The Gorard Sieve evaluates papers across six key dimensions:
    - Design: Research design quality
    - Scale: Sample size and scope
    - Completeness of Data: Missing data and attrition
    - Data Quality: Outcome measures quality
    - Fidelity: Implementation fidelity
    - Validity: Overall study validity
    
    The overall rating is determined by the "lowest link" principle - the minimum score across all categories.
    """
)
async def analyze_gorard_sieve(
    file: UploadFile = File(..., description="The research paper PDF file to analyze")
):
    """
    Analyze a research paper using the Gorard Sieve trustworthiness rubric.
    """
    # Validate file
    validate_file(file, settings)
    
    # Create temp directory if needed
    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    temp_file_path = os.path.join(settings.TEMP_DIR, file.filename)
    
    try:
        # Save uploaded file temporarily
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        logger.info(f"Starting Gorard Sieve analysis for '{file.filename}'")
        
        # Extract text from PDF
        extracted_text = extract_text_from_pdf(temp_file_path)
        if not extracted_text:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": {"code": "TEXT_EXTRACTION_FAILED", "message": "Could not extract text from PDF."}}
            )
        
        # Clean the extracted text
        cleaned_text = clean_text(extracted_text)
        
        # Get Gorard Sieve rating from Gemini
        logger.info("Sending text to Gemini for Gorard Sieve analysis...")
        gorard_analysis = get_gorard_sieve_rating(cleaned_text)
        
        # Calculate overall rating (minimum of all scores)
        scores = [
            gorard_analysis.get('design', {}).get('score', 0),
            gorard_analysis.get('scale', {}).get('score', 0),
            gorard_analysis.get('completeness_of_data', {}).get('score', 0),
            gorard_analysis.get('data_quality', {}).get('score', 0),
            gorard_analysis.get('fidelity', {}).get('score', 0),
            gorard_analysis.get('validity', {}).get('score', 0)
        ]
        
        overall_rating = min(scores) if scores else 0
        
        # Add overall rating to the response
        gorard_analysis['overall_rating'] = overall_rating
        
        logger.info(f"Gorard Sieve analysis completed. Overall rating: {overall_rating}/4")
        
        # Create the rating object
        rating = GorardSieveRating(
            design=CategoryScore(**gorard_analysis['design']),
            scale=CategoryScore(**gorard_analysis['scale']),
            completeness_of_data=CategoryScore(**gorard_analysis['completeness_of_data']),
            data_quality=CategoryScore(**gorard_analysis['data_quality']),
            fidelity=CategoryScore(**gorard_analysis['fidelity']),
            validity=CategoryScore(**gorard_analysis['validity']),
            overall_rating=overall_rating
        )
        
        analysis_info = {
            "file_name": file.filename,
            "file_size": len(content),
            "analysis_method": "gemini_ai_gorard_sieve",
            "text_length": len(cleaned_text)
        }
        
        return SuccessResponse(
            gorard_sieve_rating=rating,
            analysis_info=analysis_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze file {file.filename}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": {"code": "ANALYSIS_FAILED", "message": str(e)}}
        )
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            logger.info(f"Cleaned up temp file: {temp_file_path}")


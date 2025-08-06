# microservices_python/services/pdf_metadata_extract.py

import os
import aiofiles
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional

from config.logging import get_logger
from config.settings import settings
from utils.validators import validate_file
from utils.pdf_utils import extract_text_from_pdf
from utils.text_utils import clean_text
from utils.gemini_client import get_metadata_from_text

# Initialize logger and router
logger = get_logger(__name__)
router = APIRouter()

# --- Pydantic Models for API Response ---

class Author(BaseModel):
    name: str
    affiliation: Optional[str] = None
    email: Optional[str] = None

class Journal(BaseModel):
    name: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None

class Reference(BaseModel):
    title: str
    authors: List[str]
    year: Optional[int] = None
    doi: Optional[str] = None

class GeminiAnalysis(BaseModel):
    research_area: Optional[str] = None
    methodology: Optional[str] = None
    key_findings: List[str] = []
    limitations: List[str] = []
    research_impact: Optional[str] = None
    future_directions: List[str] = []

class Metadata(BaseModel):
    title: Optional[str] = None
    authors: List[Author] = []
    abstract: Optional[str] = None
    keywords: List[str] = []
    journal: Optional[Journal] = None
    publication_date: Optional[str] = None
    doi: Optional[str] = None
    references: List[Reference] = []
    confidence_score: float
    ai_enhanced: bool
    gemini_analysis: Optional[GeminiAnalysis] = None
    
    # ADDITION: New optional field for the summary.
    detailed_summary: Optional[str] = None

class ProcessingInfo(BaseModel):
    file_size: int
    pages_processed: int
    extraction_method: str
    ai_processing_time: Optional[float] = None
    gemini_tokens_used: Optional[int] = None

class SuccessResponse(BaseModel):
    success: bool = True
    metadata: Metadata
    processing_info: ProcessingInfo

# ... (Error models remain the same) ...

@router.post(
    "/extract-metadata",
    response_model=SuccessResponse,
    # ... (responses dict remains the same) ...
    summary="Extracts metadata and optionally a detailed summary from a PDF file"
)
async def extract_metadata(
    file: UploadFile = File(..., description="The PDF file to be processed."),
    # MODIFICATION: The enable_ai_analysis flag is removed as it's now the only pathway.
    # MODIFICATION: The analysis_depth is removed for simplicity.
    # ADDITION: New boolean flag to request a summary.
    need_detailed_summary: bool = Form(False, description="Set to true to generate a detailed summary of the document.")
):
    validate_file(file, settings)

    os.makedirs(settings.TEMP_DIR, exist_ok=True)
    temp_file_path = os.path.join(settings.TEMP_DIR, file.filename)
    
    try:
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        logger.info(f"Starting metadata extraction for '{file.filename}'. Summary requested: {need_detailed_summary}")

        extracted_text = extract_text_from_pdf(temp_file_path)
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        cleaned_text = clean_text(extracted_text)
        
        # MODIFICATION: Pass the new boolean flag to the updated Gemini function.
        ai_metadata = get_metadata_from_text(cleaned_text, need_summary=need_detailed_summary)

        # The ai_metadata dict will now conditionally contain a "detailed_summary" key.
        # Pydantic will automatically handle it, assigning None if it's not present.
        metadata_obj = Metadata(**ai_metadata, confidence_score=0.95, ai_enhanced=True)
        
        processing_info_obj = ProcessingInfo(
            file_size=len(content),
            pages_processed=min(5, len(extracted_text.split('\f'))), # Simple page count
            extraction_method="hybrid_with_gemini"
        )

        logger.info(f"Successfully extracted metadata: {metadata_obj.title}")
        logger.info(f"Authors: {metadata_obj.authors}")
        logger.info(f"Keywords: {metadata_obj.keywords}")
        
        return SuccessResponse(metadata=metadata_obj, processing_info=processing_info_obj)

    except Exception as e:
        logger.error(f"Failed to process file {file.filename}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": {"code": "PROCESSING_FAILED", "message": str(e)}}
        )
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)